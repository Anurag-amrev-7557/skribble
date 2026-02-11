
import { Server, Socket } from 'socket.io';
import { GameManager } from '../game/GameManager';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, Stroke } from '../../shared/socket-events';
import throttle from 'lodash.throttle';

// ---------- Validation Helpers ----------

function isValidString(val: any, maxLen: number): val is string {
    return typeof val === 'string' && val.length > 0 && val.length <= maxLen;
}

function isValidRoomId(val: any): val is string {
    return typeof val === 'string' && val.length > 0 && val.length <= 10;
}

function isValidStroke(stroke: any): stroke is Stroke {
    if (!stroke || typeof stroke !== 'object') return false;
    if (!Array.isArray(stroke.points) || stroke.points.length === 0) return false;
    if (typeof stroke.color !== 'string') return false;
    if (typeof stroke.width !== 'number' || stroke.width <= 0 || stroke.width > 100) return false;
    // Validate points aren't absurd
    if (stroke.points.length > 5000) return false;
    return true;
}

// ---------- Socket Handler ----------

export const setupSocketIO = (io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    const gameManager = new GameManager(io);

    io.on('connection', (socket) => {
        console.log('[Socket] Client connected:', socket.id);

        // Rate limit map (simple in-memory)
        const rateLimits = new Map<string, number>();

        const checkRateLimit = (action: string, limit: number): boolean => {
            const key = `${socket.id}:${action}`;
            const count = rateLimits.get(key) || 0;
            if (count >= limit) return false;
            rateLimits.set(key, count + 1);
            setTimeout(() => rateLimits.set(key, (rateLimits.get(key) || 1) - 1), 1000); // Decary
            return true;
        };


        // Create Room
        socket.on('create-room', ({ name, avatar, isPrivate }, callback) => {
            try {
                if (!callback) return;
                const safeName = isValidString(name, 20) ? name.trim() : `Guest ${Math.floor(Math.random() * 9000) + 1000}`;

                const room = gameManager.createRoom(socket.id, safeName, socket, isPrivate);
                const player = room.players.get(socket.id);
                if (player) player.avatar = avatar;
                room.broadcastState();

                callback({ success: true, roomId: room.id });
            } catch (error) {
                console.error('[Socket] create-room error:', error);
                callback({ success: false, error: 'Failed to create room' });
            }
        });

        // Find available room (matchmaking)
        socket.on('find-available-room', (callback) => {
            try {
                if (!callback) return;
                const roomId = gameManager.findAvailableRoom();
                callback({ success: true, roomId });
            } catch (error) {
                console.error('[Socket] Matchmaking error:', error);
                callback({ success: false, error: 'Failed to find room' });
            }
        });

        // Join Room
        socket.on('join-room', ({ roomId, name, avatar }, callback) => {
            try {
                if (!callback) return;
                if (!isValidRoomId(roomId)) {
                    callback({ success: false, error: 'Invalid room ID' });
                    return;
                }
                const safeName = isValidString(name, 20) ? name.trim() : `Guest ${Math.floor(Math.random() * 9000) + 1000}`;

                console.log(`[Socket] Player ${safeName} joining room ${roomId}`);
                const room = gameManager.joinRoom(roomId, socket.id, safeName, socket);

                const player = room.players.get(socket.id);
                if (player) player.avatar = avatar;
                room.broadcastState();

                callback({ success: true, roomState: room.getRoomState() });
            } catch (error: any) {
                console.error('[Socket] Join error:', error);
                callback({ success: false, error: error.message || 'Failed to join room' });
            }
        });

        // Rejoin Room (reconnection)
        socket.on('rejoin-room', ({ roomId, name, avatar, oldSocketId }, callback) => {
            try {
                if (!callback) return;
                if (!isValidRoomId(roomId)) {
                    callback({ success: false, error: 'Invalid room ID' });
                    return;
                }

                const safeName = isValidString(name, 20) ? name.trim() : `Guest`;

                // Attempt rejoin
                if (oldSocketId) {
                    const room = gameManager.rejoinRoom(roomId, oldSocketId, socket.id, safeName, socket, avatar);
                    if (room) {
                        console.log(`[Socket] Player ${safeName} rejoined room ${roomId}`);
                        callback({ success: true, roomState: room.getRoomState(), reconnected: true });
                        return;
                    }
                }

                // If rejoin failed, fall back to regular join
                const room = gameManager.joinRoom(roomId, socket.id, safeName, socket);
                const player = room.players.get(socket.id);
                if (player) player.avatar = avatar;
                room.broadcastState();

                callback({ success: true, roomState: room.getRoomState(), reconnected: false });
            } catch (error: any) {
                console.error('[Socket] Rejoin error:', error);
                callback({ success: false, error: error.message || 'Failed to rejoin room' });
            }
        });

        // Draw event
        socket.on('draw-stroke', ({ roomId, stroke }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                if (!isValidStroke(stroke)) return;

                if (!checkRateLimit('draw', 60)) return; // Max 60 strokes/sec

                const room = gameManager.getRoom(roomId);
                if (room && room.currentDrawer === socket.id && room.state === 'DRAWING') {
                    room.addStroke(stroke); // Add to history
                    socket.to(roomId).emit('draw-stroke', stroke);
                }
            } catch (error) {
                console.error('[Socket] draw-stroke error:', error);
            }
        });

        // Start Game event
        socket.on('start-game', ({ roomId }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                console.log(`[Socket] Received start-game for room ${roomId} from ${socket.id}`);
                const room = gameManager.getRoom(roomId);
                if (room && room.hostId === socket.id) {
                    console.log(`[Socket] Starting game in room ${roomId}`);
                    room.startGame();
                }
            } catch (error) {
                console.error('[Socket] start-game error:', error);
            }
        });

        // Restart Game Event
        socket.on('request-restart', ({ roomId }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                const room = gameManager.getRoom(roomId);
                if (room) { // Allow any player to request? Or just host? For now, mimicking room.restartGame check (host only? No, method doesn't check host but probably should)
                    // The Room.restartGame doesn't check host explicitly but maybe it should?
                    // For now, let's restrict to host or maybe just allow it if game ended.
                    if (room.state === 'GAME_END') {
                        room.restartGame();
                    }
                }
            } catch (error) {
                console.error('[Socket] request-restart error:', error);
            }
        });

        // Chat Event
        socket.on('chat-message', ({ roomId, text }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                if (!isValidString(text, 200)) return; // Reject messages over 200 chars
                if (!checkRateLimit('chat', 5)) return; // Max 5 msgs/sec

                const room = gameManager.getRoom(roomId);
                if (room) {
                    room.handleMessage(socket.id, text);
                }
            } catch (error) {
                console.error('[Socket] chat-message error:', error);
            }
        });

        // Vote Kick Event
        socket.on('vote-kick', ({ roomId, targetId }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                if (typeof targetId !== 'string') return;

                const room = gameManager.getRoom(roomId);
                if (room) {
                    room.voteKick(socket.id, targetId);
                }
            } catch (error) {
                console.error('[Socket] vote-kick error:', error);
            }
        });

        // Rate Drawing Event
        socket.on('rate-drawing', ({ roomId, rating }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                if (rating !== 'like' && rating !== 'dislike') return;

                const room = gameManager.getRoom(roomId);
                if (room) {
                    room.handleDrawingRating(socket.id, rating);
                }
            } catch (error) {
                console.error('[Socket] rate-drawing error:', error);
            }
        });

        // Word Selection Event
        socket.on('select-word', ({ roomId, word }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                if (!isValidString(word, 50)) return;

                const room = gameManager.getRoom(roomId);
                if (room) {
                    room.handleWordSelection(socket.id, word);
                }
            } catch (error) {
                console.error('[Socket] select-word error:', error);
            }
        });

        // Update Settings
        socket.on('update-room-settings', ({ roomId, settings }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                if (!settings || typeof settings !== 'object') return;

                const room = gameManager.getRoom(roomId);
                if (room && room.isPrivate && room.hostId === socket.id) {
                    room.updateSettings(settings);
                }
            } catch (error) {
                console.error('[Socket] update-room-settings error:', error);
            }
        });

        // Clear Canvas
        socket.on('clear-canvas', ({ roomId }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                const room = gameManager.getRoom(roomId);
                if (room && room.currentDrawer === socket.id) { // Only drawer can clear
                    room.clearCanvas();
                    socket.to(roomId).emit('clear-canvas');
                }
            } catch (error) {
                console.error('[Socket] clear-canvas error:', error);
            }
        });

        // Fill Canvas
        socket.on('fill-canvas', ({ roomId, x, y, color }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                if (typeof x !== 'number' || typeof y !== 'number' || typeof color !== 'string') return;

                const room = gameManager.getRoom(roomId);
                if (room && room.currentDrawer === socket.id) {
                    room.addFill(x, y, color);
                    socket.to(roomId).emit('fill-canvas', { x, y, color });
                }
            } catch (error) {
                console.error('[Socket] fill-canvas error:', error);
            }
        });

        // Undo Last Stroke
        socket.on('undo-last-stroke', ({ roomId }) => {
            try {
                if (!isValidRoomId(roomId)) return;
                const room = gameManager.getRoom(roomId);
                if (room && room.currentDrawer === socket.id) {
                    room.undoLastAction();
                    socket.to(roomId).emit('undo-last-stroke');
                }
            } catch (error) {
                console.error('[Socket] undo-last-stroke error:', error);
            }
        });

        // Disconnect — uses grace period instead of immediate removal
        socket.on('disconnect', (reason) => {
            console.log(`[Socket] Client disconnected: ${socket.id} (reason: ${reason})`);

            if (reason === 'client namespace disconnect' || reason === 'server namespace disconnect') {
                // Intentional disconnect — remove immediately
                gameManager.removePlayer(socket.id);
            } else {
                // Network drop / transport close — use grace period
                gameManager.handleDisconnect(socket.id);
            }
        });
    });
};
