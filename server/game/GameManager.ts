
import { Room } from './Room';
import { Server, Socket } from 'socket.io';

export class GameManager {
    private rooms: Map<string, Room>;
    private io: Server;

    constructor(io: Server) {
        this.io = io;
        this.rooms = new Map();
    }

    createRoom(hostId: string, hostName: string, socket: Socket, isPrivate: boolean = false): Room {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room(roomId, this.io, isPrivate);
        this.rooms.set(roomId, room);

        room.addPlayer(hostId, hostName, socket);
        return room;
    }

    joinRoom(roomId: string, playerId: string, playerName: string, socket: Socket) {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        room.addPlayer(playerId, playerName, socket);
        return room;
    }

    getRoom(roomId: string) {
        return this.rooms.get(roomId);
    }

    findAvailableRoom(): string {
        // Find a room that is WAITING or ROUND_END (maybe?) and not full
        for (const [id, room] of this.rooms) {
            // Check if room has space (< 8 players) and is in a joinable state
            // Ideally join only when WAITING, but skribbl allows joining mid-game usually (spectating then playing next round). 
            // For now, let's prioritize WAITING rooms.
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

        // If no room found, create a new one
        // We need a dummy host ID/Name since createRoom expects them. 
        // Actually createRoom creates a room and adds the host. 
        // But here we just want to GET a room ID to return to the client so they can emit 'join-room'.
        // So we just create a room without a host yet?
        // Refactoring createRoom to optionally take host might be needed, OR 
        // we just generate a random ID and return it, and let the first joiner be the host.
        // But GameManager stores the room. So we must instantiate it.

        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

        // We can't use this.createRoom because it requires a socket.
        // Let's manually create and store.
        const room = new Room(roomId, this.io);
        this.rooms.set(roomId, room);

        console.log(`Matchmaking: Created new room ${roomId}`);
        return roomId;
    }

    removePlayer(playerId: string) {
        // Find which room player is in and remove
        // This requires checking all rooms or keeping a player->room map
        for (const [id, room] of this.rooms) {
            if (room.players.has(playerId)) {
                room.removePlayer(playerId);
                if (room.players.size === 0) {
                    this.rooms.delete(id);
                }
                break;
            }
        }
    }
}
