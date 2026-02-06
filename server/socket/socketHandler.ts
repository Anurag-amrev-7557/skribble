
import { Server, Socket } from 'socket.io';
import { GameManager } from '../game/GameManager';

export const setupSocketIO = (io: Server) => {
    const gameManager = new GameManager(io);

    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Create Room
        socket.on('create-room', ({ name, avatar, isPrivate }: { name: string, avatar?: any, isPrivate?: boolean }, callback) => {
            try {
                const room = gameManager.createRoom(socket.id, name, socket, isPrivate);
                // createRoom might need update too in GameManager, or just use getRoom + addPlayer?
                // Wait, GameManager.createRoom handles first player?
                // Let's check GameManager.
                // Assuming GameManager.createRoom calls room.addPlayer... we need to pass avatar to GameManager too!
                // Actually, let's just update room.players.get(socket.id).avatar = avatar after creation for MVP simplicity
                const player = room.players.get(socket.id);
                if (player) player.avatar = avatar;
                room.broadcastState();

                callback({ success: true, roomId: room.id });
            } catch (error) {
                callback({ success: false, error: 'Failed to create room' });
            }
        });

        // Join Room
        socket.on('find-available-room', (callback) => {
            try {
                const roomId = gameManager.findAvailableRoom();
                callback({ success: true, roomId });
            } catch (error) {
                console.error('Matchmaking error:', error);
                callback({ success: false, error: 'Failed to find room' });
            }
        });

        socket.on('join-room', ({ roomId, name, avatar }: { roomId: string; name: string, avatar?: any }, callback) => {
            try {
                console.log(`Player ${name} joining room ${roomId}`);
                const room = gameManager.joinRoom(roomId, socket.id, name, socket); // This calls addPlayer inside GameManager probably

                // We need to pass avatar to joinRoom or set it after
                const player = room.players.get(socket.id);
                if (player) player.avatar = avatar;
                room.broadcastState();

                // Serialize room data to avoid circular references if any
                const safeRoomState = {
                    id: room.id,
                    players: Array.from(room.players.values()),
                    state: room.state,
                    currentDrawer: room.currentDrawer,
                    round: room.round,
                    totalRounds: room.totalRounds,
                    isPrivate: room.isPrivate,
                    hostId: room.hostId,
                    settings: room.settings
                };
                callback({ success: true, roomState: safeRoomState });
            } catch (error: any) {
                console.error('Join error:', error);
                callback({ success: false, error: error.message || 'Failed to join room' });
            }
        });

        // Draw event
        socket.on('draw-stroke', ({ roomId, stroke }: { roomId: string; stroke: any }) => {
            // console.log(`Broadcasting stroke to ${roomId} from ${socket.id}`);
            socket.to(roomId).emit('draw-stroke', stroke);
        });

        // Start Game event
        socket.on('start-game', ({ roomId }: { roomId: string }) => {
            console.log(`Received start-game request for room ${roomId} from ${socket.id}`);
            const room = gameManager.getRoom(roomId);
            if (room) {
                console.log(`Room found: ${roomId}. Calling startGame...`);
                room.startGame();
            } else {
                console.error(`Room ${roomId} not found for start-game request`);
            }
        });

        // Chat Event
        socket.on('chat-message', ({ roomId, text }: { roomId: string; text: string }) => {
            const room = gameManager.getRoom(roomId);
            if (room) {
                room.handleMessage(socket.id, text);
            }
        });

        // Word Selection Event
        socket.on('select-word', ({ roomId, word }: { roomId: string; word: string }) => {
            const room = gameManager.getRoom(roomId);
            if (room) {
                room.handleWordSelection(socket.id, word);
            }
        });

        // Update Settings
        socket.on('update-room-settings', ({ roomId, settings }: { roomId: string; settings: any }) => {
            const room = gameManager.getRoom(roomId);
            if (room && room.isPrivate && room.hostId === socket.id) {
                room.updateSettings(settings);
            }
        });

        // Clear Canvas
        socket.on('clear-canvas', ({ roomId }: { roomId: string }) => {
            socket.to(roomId).emit('clear-canvas');
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            gameManager.removePlayer(socket.id);
        });
    });
};
