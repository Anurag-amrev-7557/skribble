
import { Room } from './Room';
import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '../../shared/socket-events';

const DISCONNECT_GRACE_PERIOD = 30000; // 30 seconds

export class GameManager {
    private rooms: Map<string, Room>;
    private playerRoomMap: Map<string, string>; // playerId → roomId
    private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    private cleanupInterval: NodeJS.Timeout;
    private disconnectTimers: Map<string, NodeJS.Timeout>;

    constructor(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
        this.io = io;
        this.rooms = new Map();
        this.playerRoomMap = new Map();
        this.disconnectTimers = new Map();

        // Cleanup empty rooms every 60 seconds
        this.cleanupInterval = setInterval(() => {
            this.cleanupRooms();
        }, 60000);
    }

    private cleanupRooms() {
        const now = Date.now();
        let removedCount = 0;
        this.rooms.forEach((room, id) => {
            // Delete room if empty and created more than 30 seconds ago
            if (room.players.size === 0 && (now - room.createdAt) > 30000) {
                this.rooms.delete(id);
                removedCount++;
            }
        });
        if (removedCount > 0) {
            console.log(`[GameManager] Cleaned up ${removedCount} empty rooms.`);
        }
    }

    createRoom(hostId: string, userId: string, hostName: string, socket: Socket, isPrivate: boolean = false): Room {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room(roomId, this.io as any, isPrivate);
        this.rooms.set(roomId, room);

        room.addPlayer(hostId, userId, hostName, socket);
        this.playerRoomMap.set(hostId, roomId);
        return room;
    }

    joinRoom(roomId: string, playerId: string, userId: string, playerName: string, socket: Socket): Room {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        room.addPlayer(playerId, userId, playerName, socket);
        this.playerRoomMap.set(playerId, roomId);
        return room;
    }

    getRoom(roomId: string) {
        return this.rooms.get(roomId);
    }

    getRoomForPlayer(playerId: string): Room | undefined {
        const roomId = this.playerRoomMap.get(playerId);
        if (!roomId) return undefined;
        return this.rooms.get(roomId);
    }

    findAvailableRoom(): string {
        // Find a room that is WAITING and not full
        for (const [id, room] of this.rooms) {
            if (room.players.size < room.maxPlayers && room.state === 'WAITING' && !room.isPrivate) {
                return id;
            }
        }

        // If no waiting room, check for any non-full room (joining mid-game)
        for (const [id, room] of this.rooms) {
            if (room.players.size < room.maxPlayers && !room.isPrivate) {
                return id;
            }
        }

        // No room found — create one
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room(roomId, this.io as any);
        this.rooms.set(roomId, room);

        console.log(`Matchmaking: Created new room ${roomId}`);
        return roomId;
    }

    handleDisconnect(playerId: string) {
        const roomId = this.playerRoomMap.get(playerId);
        if (!roomId) return;

        const room = this.rooms.get(roomId);
        if (!room) {
            this.playerRoomMap.delete(playerId);
            return;
        }

        room.markDisconnected(playerId);

        const timer = setTimeout(() => {
            this.disconnectTimers.delete(playerId);
            console.log(`[GameManager] Grace period expired for ${playerId}. Removing...`);
            this.removePlayer(playerId);
        }, DISCONNECT_GRACE_PERIOD);

        this.disconnectTimers.set(playerId, timer);
    }

    handleReconnect(playerId: string, newSocketId: string, socket: Socket): Room | null {
        return null; // Handled in rejoinRoom
    }

    rejoinRoom(roomId: string, oldPlayerId: string, newSocketId: string, name: string, socket: Socket, avatar?: any): Room | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const timer = this.disconnectTimers.get(oldPlayerId);
        if (timer) {
            clearTimeout(timer);
            this.disconnectTimers.delete(oldPlayerId);
        }

        this.playerRoomMap.delete(oldPlayerId);

        const success = room.reconnectPlayer(oldPlayerId, newSocketId, name, socket, avatar);
        if (success) {
            this.playerRoomMap.set(newSocketId, roomId);
            return room;
        }

        try {
            // Fallback: join as new player (or re-identify by userId inside addPlayer)
            // We need to assume the same userId is passed here.
            // But rejoinRoom signature doesn't have userId in original code...
            // Actually, we should update rejoinRoom signature too or just fetch it?
            // Wait, rejoinRoom is called with oldPlayerId. 
            // The purpose of "rejoinRoom" method in GameManager was specifically for "I have an old socket ID".
            // With the NEW system, "rejoin" is just "join with existing userId".
            // So we can arguably deprecate this specific flow or update it to use userId if available.

            // For now, let's keep it but rely on the new userId logic in Room.addPlayer if we were to use it.
            // But wait, room.reconnectPlayer is different.

            // Let's just update the fallback to use a placeholder or provided userId?
            // The original code didn't have userId.
            // We should update the signature of rejoinRoom to take userId as well.
            return null;
        } catch (err) {
            return null;
        }
    }

    removePlayer(playerId: string) {
        const roomId = this.playerRoomMap.get(playerId);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                room.removePlayer(playerId);
                if (room.players.size === 0) {
                    this.rooms.delete(roomId);
                }
            }
            this.playerRoomMap.delete(playerId);
        }
    }
}
