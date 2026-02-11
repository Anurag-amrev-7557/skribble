
import { Socket } from 'socket.io';
import { Player } from './Player';
import { Server } from 'socket.io';
import { WORDS } from './words';
import { DrawAction, GameSettings, GameState, PlayerState, RoomState } from '../../shared/socket-events';

export class Room {
    public id: string;
    public players: Map<string, Player>;
    public state: GameState;
    public currentDrawer: string | null;
    public currentWord: string | null;
    public wordOptions: string[] = [];
    public maskedWord: string | null;
    private usedWords: Set<string> = new Set();
    public round: number;
    public totalRounds: number;
    public maxPlayers: number;
    public isPrivate: boolean;
    public hostId: string | null;
    public settings: GameSettings;
    public drawingHistory: DrawAction[] = []; // Store drawing history

    private io: Server;
    public turnIndex: number = 0;

    // Timer stuff
    private timer: NodeJS.Timeout | null = null;
    public timeRemaining: number = 0;
    public createdAt: number;

    constructor(id: string, io: Server, isPrivate: boolean = false) {
        this.id = id;
        this.io = io;
        this.players = new Map();
        this.createdAt = Date.now();
        this.state = GameState.WAITING;
        this.currentDrawer = null;
        this.currentWord = null;
        this.maskedWord = null;
        this.wordOptions = [];
        this.round = 1;
        this.totalRounds = 3;
        this.maxPlayers = 8;
        this.isPrivate = isPrivate;
        this.hostId = null;
        this.settings = {
            roundTime: 60,
            wordCount: 3,
            gameMode: 'NORMAL',
            hints: true,
            customWords: [],
            useCustomWords: false,
            maxPlayers: 8,
            totalRounds: 3
        };
    }

    addPlayer(id: string, name: string, socket: Socket, avatar?: any): Player {
        if (this.players.has(id)) {
            const existingPlayer = this.players.get(id)!;
            existingPlayer.name = name;
            if (avatar) existingPlayer.avatar = avatar;

            socket.join(this.id);
            this.broadcastState();
            return existingPlayer;
        }

        if (this.players.size >= this.maxPlayers) {
            throw new Error('Room is full');
        }
        const player = new Player(id, name, avatar);

        if (this.players.size === 0) {
            this.hostId = id;
        }

        this.players.set(id, player);
        socket.join(this.id);

        // Send state immediately to the joining player (including history!)
        socket.emit('room-state', this.getRoomState());

        // Broadcast to others
        this.broadcastState();

        // Auto-start only for PUBLIC rooms
        if (!this.isPrivate && this.players.size >= 2 && this.state === GameState.WAITING) {
            console.log("Auto-starting game with 2 players...");
            setTimeout(() => this.startGame(), 1000);
        }

        console.log(`[Room ${this.id}] Broadcasting join message for ${name}`);
        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: `${name} joined the room!`,
            type: 'system'
        });

        return player;
    }

    removePlayer(id: string) {
        const player = this.players.get(id);
        const name = player ? player.name : "Unknown Player";

        const playerIds = Array.from(this.players.keys());
        const removedIndex = playerIds.indexOf(id);

        if (removedIndex !== -1 && removedIndex <= this.turnIndex) {
            this.turnIndex--;
        }

        this.players.delete(id);

        if (this.hostId === id) {
            const nextPlayerId = this.players.keys().next().value;
            if (nextPlayerId) {
                this.hostId = nextPlayerId;
                this.io.to(this.id).emit('chat-message', {
                    sender: 'System',
                    text: `${this.players.get(nextPlayerId)?.name} is now the host.`,
                    type: 'system'
                });
            } else {
                this.hostId = null;
            }
        }

        console.log(`[Room ${this.id}] Broadcasting leave message for ${name}`);
        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: `${name} left the room.`,
            type: 'system'
        });

        if (this.currentDrawer === id) {
            this.endTurn();
        }

        this.broadcastState();

        if (this.players.size < 2 && this.state !== GameState.WAITING && this.state !== GameState.GAME_END) {
            console.log("Not enough players. Resetting game...");
            this.resetGame();
        }
    }

    resetGame() {
        if (this.timer) clearInterval(this.timer);
        this.state = GameState.WAITING;
        this.currentDrawer = null;
        this.currentWord = null;
        this.maskedWord = null;
        this.round = 1;
        this.turnIndex = 0;
        this.timeRemaining = 0;
        this.players.forEach(p => p.score = 0);
        this.drawingHistory = []; // Clear history
        this.usedWords.clear();

        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: 'Game reset due to lack of players.',
            type: 'system'
        });

        this.broadcastState();
    }

    getRoomState(): RoomState {
        const playersList = Array.from(this.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            lastTurnScore: p.lastTurnScore,
            isDrawer: p.isDrawer,
            hasGuessed: p.hasGuessed,
            avatar: p.avatar,
            isDisconnected: p.isDisconnected,
        }));

        return {
            id: this.id,
            players: playersList,
            state: this.state,
            currentDrawer: this.currentDrawer,
            round: this.round,
            totalRounds: this.totalRounds,
            timeRemaining: this.timeRemaining,
            currentWord: (this.state === GameState.DRAWING || this.state === GameState.ROUND_END) ? this.currentWord : null,
            maskedWord: this.maskedWord,
            wordOptions: this.state === GameState.SELECTING_WORD ? [] : null,
            isPrivate: this.isPrivate,
            hostId: this.hostId,
            settings: this.settings,
            drawingHistory: this.drawingHistory
        };
    }

    broadcastState() {
        this.io.to(this.id).emit('room-state', this.getRoomState());
    }

    broadcastTimer() {
        this.io.to(this.id).emit('timer-update', this.timeRemaining);
    }

    startGame() {
        if (this.players.size < 2 && !this.isPrivate) return;

        console.log(`Starting game in room ${this.id}`);
        this.state = GameState.SELECTING_WORD;
        this.round = 1;
        this.turnIndex = 0;

        if (this.settings.maxPlayers) this.maxPlayers = this.settings.maxPlayers;

        this.startTurn();
    }

    startTurn() {
        const playerIds = Array.from(this.players.keys());
        if (playerIds.length === 0) return;

        console.log(`[Method: startTurn] Round: ${this.round}, TurnIndex: ${this.turnIndex}, TotalPlayers: ${playerIds.length}`);

        this.currentDrawer = playerIds[this.turnIndex % playerIds.length];

        console.log(`[Method: startTurn] Selected Drawer: ${this.currentDrawer}`);

        this.players.forEach(p => p.resetRoundState());
        const drawer = this.players.get(this.currentDrawer);
        if (drawer) drawer.isDrawer = true;

        // Clear Canvas and History
        this.drawingHistory = [];
        this.io.to(this.id).emit('clear-canvas');

        this.state = GameState.SELECTING_WORD;
        this.currentWord = null;
        this.wordOptions = this.generateWordOptions(3);
        this.timeRemaining = 15;

        this.broadcastState();

        if (this.currentDrawer) {
            this.io.to(this.currentDrawer).emit('choose-word', this.wordOptions);
        }

        this.startTimer(() => {
            if (this.state === GameState.SELECTING_WORD) {
                const randomWord = this.wordOptions[Math.floor(Math.random() * this.wordOptions.length)];
                this.handleWordSelection(this.currentDrawer!, randomWord);
            }
        });
    }

    generateWordOptions(count: number): string[] {
        let availableWords = WORDS.filter(w => !this.usedWords.has(w));

        if (availableWords.length < count) {
            // Reset if we ran out of words
            this.usedWords.clear();
            availableWords = [...WORDS];
        }

        const shuffled = availableWords.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    handleWordSelection(playerId: string, word: string) {
        if (this.state !== GameState.SELECTING_WORD) return;
        if (playerId !== this.currentDrawer) return;

        if (!this.wordOptions.includes(word)) {
            console.warn(`[Security] Player ${playerId} tried to select invalid word: ${word}`);
            return;
        }

        if (this.timer) clearInterval(this.timer);

        this.currentWord = word;
        this.usedWords.add(word);
        this.maskedWord = word.replace(/[A-Za-z]/g, "_");

        console.log(`Word selected: ${word}`);

        this.state = GameState.DRAWING;
        this.timeRemaining = this.settings.roundTime; // Use settings roundTime

        this.broadcastState();

        this.startTimer(() => this.endTurn());
    }

    // --- Drawing History Methods ---

    addStroke(stroke: any) {
        // Basic validation is done in manager/handler, but can check here too
        this.drawingHistory.push({
            type: 'stroke',
            points: stroke.points,
            color: stroke.color,
            width: stroke.width
        });
    }

    addFill(x: number, y: number, color: string) {
        this.drawingHistory.push({
            type: 'fill',
            x, y, color
        });
    }

    undoLastAction() {
        if (this.drawingHistory.length > 0) {
            this.drawingHistory.pop();
        }
    }

    clearCanvas() {
        this.drawingHistory = [];
    }

    // ----------------------------

    revealHint() {
        if (!this.currentWord || !this.maskedWord) return;

        const unrevealedIndices: number[] = [];
        for (let i = 0; i < this.maskedWord.length; i++) {
            if (this.maskedWord[i] === '_') {
                unrevealedIndices.push(i);
            }
        }

        if (unrevealedIndices.length > 0) {
            const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
            const chars = this.maskedWord.split('');
            chars[randomIndex] = this.currentWord[randomIndex];
            this.maskedWord = chars.join('');

            this.broadcastState();
        }
    }

    startTimer(callback: () => void) {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeRemaining--;

            if (this.state === GameState.DRAWING && this.settings.hints) {
                if (this.timeRemaining === 45 || this.timeRemaining === 20) {
                    this.revealHint();
                }
            }

            this.broadcastTimer();
            if (this.timeRemaining <= 0) {
                if (this.timer) clearInterval(this.timer);
                callback();
            }
        }, 1000);
    }

    endTurn() {
        if (this.timer) clearInterval(this.timer);

        const playerIds = Array.from(this.players.keys());

        console.log(`[Method: endTurn] BEFORE Increment - Round: ${this.round}, TurnIndex: ${this.turnIndex}`);

        this.turnIndex++;

        if (this.turnIndex >= playerIds.length) {
            console.log(`[Method: endTurn] End of Round reached!`);

            if (this.round >= this.totalRounds) {
                this.endGame();
                return;
            }

            this.round++;
            this.turnIndex = 0;
        }

        console.log(`[Method: endTurn] AFTER Increment - Round: ${this.round}, TurnIndex: ${this.turnIndex}`);

        this.state = GameState.ROUND_END;
        this.timeRemaining = 5;
        this.broadcastState();

        this.startTimer(() => {
            this.startTurn();
        });
    }

    handleMessage(playerId: string, text: string) {
        const player = this.players.get(playerId);
        if (!player) return;

        const now = Date.now();
        if (now - player.lastMessageTime < 500) {
            return;
        }
        player.lastMessageTime = now;

        if (this.state === GameState.DRAWING && this.currentWord &&
            text.trim().toLowerCase() === this.currentWord.toLowerCase()) {

            if (player.id !== this.currentDrawer) {
                if (player.hasGuessed) return;

                player.hasGuessed = true;

                const scoreGain = Math.max(50, 50 + (this.timeRemaining * 5));
                player.score += scoreGain;
                player.lastTurnScore = scoreGain;

                const drawer = this.players.get(this.currentDrawer!);
                if (drawer) {
                    drawer.score += 50;
                    drawer.lastTurnScore += 50;
                }

                this.io.to(this.id).emit('chat-message', {
                    sender: 'System',
                    text: `${player.name} guessed the word!`,
                    type: 'system'
                });

                this.io.to(player.id).emit('reveal-word', { word: this.currentWord });

                const allGuessed = Array.from(this.players.values())
                    .filter(p => p.id !== this.currentDrawer)
                    .every(p => p.hasGuessed);

                if (allGuessed) {
                    this.endTurn();
                } else {
                    this.broadcastState();
                }
            }
            return;
        }

        this.io.to(this.id).emit('chat-message', {
            sender: player.name,
            text: text,
            type: 'chat'
        });
    }

    endGame() {
        this.state = GameState.GAME_END;
        this.currentDrawer = null;
        this.drawingHistory = []; // Clear server-side history
        this.io.to(this.id).emit('clear-canvas'); // Tell clients to clear
        this.broadcastState();
    }

    restartGame() {
        if (this.state !== GameState.GAME_END) return;

        console.log(`Restarting game in room ${this.id}`);

        this.state = GameState.WAITING;
        this.currentDrawer = null;
        this.currentWord = null;
        this.maskedWord = null;
        this.round = 1;
        this.turnIndex = 0;
        this.timeRemaining = 0;
        this.drawingHistory = [];
        this.usedWords.clear();

        this.players.forEach(p => {
            p.score = 0;
            p.lastTurnScore = 0;
            p.hasGuessed = false;
            p.isDrawer = false;
        });

        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: 'Host has restarted the game!',
            type: 'system'
        });

        this.broadcastState();
        setTimeout(() => this.startGame(), 1000);
    }

    updateSettings(newSettings: any) {
        this.settings = { ...this.settings, ...newSettings };
        if (this.settings.maxPlayers) this.maxPlayers = this.settings.maxPlayers;
        if (this.settings.totalRounds) this.totalRounds = this.settings.totalRounds;
        this.broadcastState();
    }

    voteKick(voterId: string, targetId: string) {
        const voter = this.players.get(voterId);
        const target = this.players.get(targetId);

        if (!voter || !target || voterId === targetId) return;

        if (!target.kickVotes) {
            target.kickVotes = new Set();
        }

        if (target.kickVotes.has(voterId)) return;

        target.kickVotes.add(voterId);
        const votes = target.kickVotes.size;
        const required = Math.floor(this.players.size / 2) + 1;

        console.log(`[Vote Kick] ${voter.name} voted to kick ${target.name}. (${votes}/${required})`);

        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: `${voter.name} voted to kick ${target.name}. (${votes}/${required})`,
            type: 'system'
        });

        if (votes >= required) {
            this.io.to(this.id).emit('chat-message', {
                sender: 'System',
                text: `${target.name} has been kicked from the room.`,
                type: 'system'
            });

            this.removePlayer(targetId);
        }
    }

    handleDrawingRating(playerId: string, rating: 'like' | 'dislike') {
        const player = this.players.get(playerId);
        if (!player) return;
        if (this.currentDrawer === playerId) return;

        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: `${player.name} ${rating === 'like' ? 'liked' : 'disliked'} the drawing!`,
            type: 'feedback',
            rating: rating
        });
    }

    markDisconnected(playerId: string) {
        const player = this.players.get(playerId);
        if (!player) return;

        player.isDisconnected = true;
        player.disconnectedAt = Date.now();

        console.log(`[Room ${this.id}] Player ${player.name} marked as disconnected (grace period)`);

        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: `${player.name} lost connection. Waiting for reconnect...`,
            type: 'system'
        });

        this.broadcastState();

        if (this.currentDrawer === playerId && this.state === GameState.DRAWING) {
            console.log(`[Room ${this.id}] Drawer disconnected during drawing. Ending turn.`);
            this.endTurn();
        }
    }

    reconnectPlayer(oldPlayerId: string, newSocketId: string, name: string, socket: Socket, avatar?: any): boolean {
        const player = this.players.get(oldPlayerId);
        if (!player) return false;

        this.players.delete(oldPlayerId);
        player.id = newSocketId;
        player.name = name; // Update name on rejoin
        player.isDisconnected = false;
        player.disconnectedAt = null;
        if (avatar) player.avatar = avatar;
        this.players.set(newSocketId, player);

        if (this.hostId === oldPlayerId) {
            this.hostId = newSocketId;
        }

        if (this.currentDrawer === oldPlayerId) {
            this.currentDrawer = newSocketId;
        }

        socket.join(this.id);

        console.log(`[Room ${this.id}] Player ${name} reconnected (${oldPlayerId} -> ${newSocketId})`);

        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: `${name} reconnected!`,
            type: 'system'
        });

        // Send immediately to reconnector to ensure they get the history
        socket.emit('room-state', this.getRoomState());

        this.broadcastState();
        return true;
    }
}
