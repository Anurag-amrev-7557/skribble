
import { Room } from './Room';
import { Server, Socket } from 'socket.io';

const DISCONNECT_GRACE_PERIOD = 30000; // 30 seconds

export class GameManager {
    private rooms: Map<string, Room>;
    private playerRoomMap: Map<string, string>; // playerId → roomId (O(1) lookup)
    private io: Server;
    private cleanupInterval: NodeJS.Timeout;
    private disconnectTimers: Map<string, NodeJS.Timeout>; // playerId → grace timer

    constructor(io: Server) {
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

    createRoom(hostId: string, hostName: string, socket: Socket, isPrivate: boolean = false): Room {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room(roomId, this.io, isPrivate);
        this.rooms.set(roomId, room);

        room.addPlayer(hostId, hostName, socket);
        this.playerRoomMap.set(hostId, roomId);
        return room;
    }

    joinRoom(roomId: string, playerId: string, playerName: string, socket: Socket) {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        room.addPlayer(playerId, playerName, socket);
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
        const room = new Room(roomId, this.io);
        this.rooms.set(roomId, room);

        console.log(`Matchmaking: Created new room ${roomId}`);
        return roomId;
    }

    /**
     * Handle a player disconnect with a grace period.
     * Marks the player as disconnected and schedules full removal.
     */
    handleDisconnect(playerId: string) {
        const roomId = this.playerRoomMap.get(playerId);
        if (!roomId) return;

        const room = this.rooms.get(roomId);
        if (!room) {
            this.playerRoomMap.delete(playerId);
            return;
        }

        // Mark as disconnected instead of removing immediately
        room.markDisconnected(playerId);

        // Schedule full removal after grace period
        const timer = setTimeout(() => {
            this.disconnectTimers.delete(playerId);
            console.log(`[GameManager] Grace period expired for ${playerId}. Removing...`);
            this.removePlayer(playerId);
        }, DISCONNECT_GRACE_PERIOD);

        this.disconnectTimers.set(playerId, timer);
    }

    /**
     * Handle a player reconnecting. Cancels the grace period timer
     * and restores them in-room.
     */
    handleReconnect(playerId: string, newSocketId: string, socket: Socket): Room | null {
        // The old playerId may differ from newSocketId after reconnection
        // We look up by the roomId stored in the rejoin payload (handled in socketHandler)
        // This method is called when we know which room to rejoin
        return null; // Handled at socketHandler level
    }

    /**
     * Attempt to rejoin a specific room with a new socket.
     * Returns the room if successful, null otherwise.
     */
    rejoinRoom(roomId: string, oldPlayerId: string, newSocketId: string, name: string, socket: Socket, avatar?: any): Room | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        // Cancel grace period timer if it exists
        const timer = this.disconnectTimers.get(oldPlayerId);
        if (timer) {
            clearTimeout(timer);
            this.disconnectTimers.delete(oldPlayerId);
        }

        // Clean up old player mapping
        this.playerRoomMap.delete(oldPlayerId);

        // Try to reconnect the player in the room
        const success = room.reconnectPlayer(oldPlayerId, newSocketId, name, socket, avatar);
        if (success) {
            this.playerRoomMap.set(newSocketId, roomId);
            return room;
        }

        // If reconnect failed (player was already fully removed), just add as new player
        try {
            room.addPlayer(newSocketId, name, socket, avatar);
            this.playerRoomMap.set(newSocketId, roomId);
            return room;
        } catch (err) {
            return null;
        }
    }

    removePlayer(playerId: string) {
        // O(1) lookup via playerRoomMap
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
