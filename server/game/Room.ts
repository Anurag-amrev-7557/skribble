
import { Socket } from 'socket.io';
import { Player } from './Player';
import { Server } from 'socket.io';
import { WORDS } from './words';

export enum GameState {
    WAITING = 'WAITING',
    SELECTING_WORD = 'SELECTING_WORD',
    DRAWING = 'DRAWING',
    ROUND_END = 'ROUND_END',
    GAME_END = 'GAME_END',
}



export class Room {
    public id: string;
    public players: Map<string, Player>;
    public state: GameState;
    public currentDrawer: string | null;
    public currentWord: string | null;
    public wordOptions: string[] = []; // Store current options
    public maskedWord: string | null; // Add maskedWord property
    public round: number;
    public totalRounds: number;
    public maxPlayers: number;
    public isPrivate: boolean;
    public hostId: string | null;
    public settings: {
        roundTime: number;
        wordCount: number;
        gameMode: 'NORMAL' | 'HIDDEN' | 'COMBINATION';
        hints: boolean;
        customWords: string[];
        useCustomWords: boolean;
        maxPlayers: number;
        totalRounds?: number;
    };
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
            maxPlayers: 8
        };
    }

    addPlayer(id: string, name: string, socket: Socket, avatar?: any): Player {
        if (this.players.has(id)) {
            // Player already exists (re-join or StrictMode double-call)
            // Just return existing player, do not broadcast "joined" again
            const existingPlayer = this.players.get(id)!;
            existingPlayer.name = name; // Update name just in case
            if (avatar) existingPlayer.avatar = avatar;

            socket.join(this.id); // Ensure joined room
            // We might still want to send state to THIS player, but broadcastState sends to room.
            // broadcastState is fine to call again as it's idempotent-ish (just updates UI).
            this.broadcastState();
            return existingPlayer;
        }

        if (this.players.size >= this.maxPlayers) {
            throw new Error('Room is full');
        }
        const player = new Player(id, name, avatar);

        // First player is host, or if host left and new player comes (implement logic if needed, for now just first player)
        if (this.players.size === 0) {
            this.hostId = id;
        }

        this.players.set(id, player);

        socket.join(this.id);
        this.broadcastState();

        // Auto-start only for PUBLIC rooms
        if (!this.isPrivate && this.players.size >= 2 && this.state === GameState.WAITING) {
            console.log("Auto-starting game with 2 players...");
            // Adding a small delay to let the UI update first
            setTimeout(() => this.startGame(), 1000);
        }

        console.log(`[Room ${this.id}] Broadcasting join message for ${name}`);
        // Notify room of new player
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

        // Fix turn skipping:
        // If the removed player is BEFORE the current turn index (or IS the current one),
        // we need to decrement turnIndex so that when the array shifts, we don't skip the next person.
        const playerIds = Array.from(this.players.keys());
        const removedIndex = playerIds.indexOf(id);

        if (removedIndex !== -1 && removedIndex <= this.turnIndex) {
            this.turnIndex--;
        }

        this.players.delete(id);

        if (this.hostId === id) {
            // Reassign host to next player
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

        // Notify room of player leaving
        console.log(`[Room ${this.id}] Broadcasting leave message for ${name}`);
        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: `${name} left the room.`,
            type: 'system'
        });

        if (this.currentDrawer === id) {
            // Handle drawer leaving logic: Skip turn or reset
            this.endTurn();
        }

        this.broadcastState();

        // Auto-Stop / Reset if less than 2 players
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
        this.players.forEach(p => p.score = 0); // Optional: reset scores

        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: 'Game reset due to lack of players.',
            type: 'system'
        });

        this.broadcastState();
    }

    broadcastState() {
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
        this.io.to(this.id).emit('room-state', {
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
            settings: this.settings
        });
    }

    broadcastTimer() {
        this.io.to(this.id).emit('timer-update', this.timeRemaining);
    }

    startGame() {
        if (this.players.size < 2 && !this.isPrivate) return; // Public rooms need 2 players to start
        if (this.players.size < 2 && this.isPrivate) {
            // For private rooms, maybe allow 1 player for testing or specific modes? 
            // But usually skribbl needs 2. Let's allow host to start but it might end early if not enough players.
            // Actually, let's enforce 2 players for now to be safe, or just 1 for debugging.
        }

        console.log(`Starting game in room ${this.id}`);
        this.state = GameState.SELECTING_WORD;
        this.round = 1;
        this.turnIndex = 0;

        // Apply Settings
        if (this.settings.maxPlayers) this.maxPlayers = this.settings.maxPlayers;
        if (this.settings.roundTime) this.timeRemaining = this.settings.roundTime; // For first round? No, roundTime is per turn.

        this.startTurn();
    }

    startTurn() {
        const playerIds = Array.from(this.players.keys());
        if (playerIds.length === 0) return;

        console.log(`[Method: startTurn] Round: ${this.round}, TurnIndex: ${this.turnIndex}, TotalPlayers: ${playerIds.length}`);

        // Round Robin
        this.currentDrawer = playerIds[this.turnIndex % playerIds.length];

        console.log(`[Method: startTurn] Selected Drawer: ${this.currentDrawer}`);

        // Reset players
        this.players.forEach(p => p.resetRoundState());
        const drawer = this.players.get(this.currentDrawer);
        if (drawer) drawer.isDrawer = true;

        // Clear Canvas for everyone
        this.io.to(this.id).emit('clear-canvas');

        // --- WORD SELECTION PHASE ---
        this.state = GameState.SELECTING_WORD;
        this.currentWord = null;
        this.wordOptions = this.generateWordOptions(3); // Pick 3 random words
        this.timeRemaining = 15; // 15 seconds to choose

        // Notify everyone state changed
        this.broadcastState();

        // Send options ONLY to drawer
        if (this.currentDrawer) {
            this.io.to(this.currentDrawer).emit('choose-word', this.wordOptions);
        }

        // Start Selection Timer
        this.startTimer(() => {
            // If time runs out, auto-select random word
            if (this.state === GameState.SELECTING_WORD) {
                const randomWord = this.wordOptions[Math.floor(Math.random() * this.wordOptions.length)];
                this.handleWordSelection(this.currentDrawer!, randomWord);
            }
        });
    }

    generateWordOptions(count: number): string[] {
        const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    handleWordSelection(playerId: string, word: string) {
        if (this.state !== GameState.SELECTING_WORD) return;
        if (playerId !== this.currentDrawer) return;

        // Security Check: Ensure word is in the options
        if (!this.wordOptions.includes(word)) {
            console.warn(`[Security] Player ${playerId} tried to select invalid word: ${word}`);
            return;
        }

        if (this.timer) clearInterval(this.timer);

        this.currentWord = word;
        this.maskedWord = word.replace(/[A-Za-z]/g, "_");

        console.log(`Word selected: ${word}`);

        // Start Drawing Phase
        this.state = GameState.DRAWING;
        this.timeRemaining = 60;

        this.broadcastState();

        // Start Game Timer
        this.startTimer(() => this.endTurn());
    }

    revealHint() {
        if (!this.currentWord || !this.maskedWord) return;

        // Find indices of unrevealed characters ('_')
        const unrevealedIndices: number[] = [];
        for (let i = 0; i < this.maskedWord.length; i++) {
            if (this.maskedWord[i] === '_') {
                unrevealedIndices.push(i);
            }
        }

        if (unrevealedIndices.length > 0) {
            // Pick random index to reveal
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

            // --- HINT LOGIC ---
            // Reveal hints at specific timestamps (e.g. 45s and 20s left in a 60s round)
            if (this.state === GameState.DRAWING) {
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

        // Check if round is over
        const playerIds = Array.from(this.players.keys());

        console.log(`[Method: endTurn] BEFORE Increment - Round: ${this.round}, TurnIndex: ${this.turnIndex}`);

        this.turnIndex++;

        if (this.turnIndex >= playerIds.length) {
            console.log(`[Method: endTurn] End of Round reached!`);

            // Check if game should end
            if (this.round >= this.totalRounds) {
                this.endGame();
                return;
            }

            // End of Round - Increment
            this.round++;
            this.turnIndex = 0;
        }

        console.log(`[Method: endTurn] AFTER Increment - Round: ${this.round}, TurnIndex: ${this.turnIndex}`);

        // Short pause before next turn
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

        // Rate Limiting (Spam Protection)
        const now = Date.now();
        if (now - player.lastMessageTime < 500) {
            // Too fast (less than 500ms), ignore
            return;
        }
        player.lastMessageTime = now;

        // Check if guess
        if (this.state === GameState.DRAWING && this.currentWord &&
            text.trim().toLowerCase() === this.currentWord.toLowerCase()) {

            // Correct Guess!
            if (player.id !== this.currentDrawer) {
                // Prevent multiple guesses (check if already guessed)
                if (player.hasGuessed) return;

                player.hasGuessed = true;

                // --- SCORING LOGIC ---
                // Base: 50, Max Time Bonus: 400 (if guessed instantly at 60s), Min Bonus: 0
                // Formula: 50 + (Multiplier * TimeRemaining)
                // Let's say Multiplier = 5
                const scoreGain = Math.max(50, 50 + (this.timeRemaining * 5));
                player.score += scoreGain;
                player.lastTurnScore = scoreGain;

                // Drawer Bonus: +50 per correct guess
                const drawer = this.players.get(this.currentDrawer!);
                if (drawer) {
                    drawer.score += 50;
                    drawer.lastTurnScore += 50;
                }

                // Notify room
                this.io.to(this.id).emit('chat-message', {
                    sender: 'System',
                    text: `${player.name} guessed the word!`,
                    type: 'system'
                });

                // Reveal word to the successful guesser
                this.io.to(player.id).emit('reveal-word', { word: this.currentWord });

                // End turn if EVERYONE has guessed (minus drawer)
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

        // Regular chat
        this.io.to(this.id).emit('chat-message', {
            sender: player.name,
            text: text,
            type: 'chat'
        });
    }

    endGame() {
        this.state = GameState.GAME_END;
        this.currentDrawer = null;
        this.broadcastState();
    }

    restartGame() {
        if (this.state !== GameState.GAME_END) return;

        console.log(`Restarting game in room ${this.id}`);

        // Reset Game State but keep players
        this.state = GameState.WAITING;
        this.currentDrawer = null;
        this.currentWord = null;
        this.maskedWord = null;
        this.round = 1;
        this.turnIndex = 0;
        this.timeRemaining = 0;

        // Reset Player Scores
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

        // Auto-start after a short delay or let host start?
        // Let's auto-start for smooth flow since "Play Again" implies starting.
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

        // Initialize vote set if needed
        if (!target.kickVotes) {
            target.kickVotes = new Set();
        }

        if (target.kickVotes.has(voterId)) {
            // Already voted
            return;
        }

        target.kickVotes.add(voterId);

        const votes = target.kickVotes.size;
        const required = Math.floor(this.players.size / 2) + 1; // > 50%

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

            // Kick the player
            // We need to emit a specific event to the kicked player so they know?
            // "removePlayer" just handles room logic. 
            // In socketHandler we should listen for 'kicked' or just disconnect them.
            // For now, removing them triggers 'leave' message.
            // But we should probably explicitly disconnect their socket if possible, 
            // or just let them be "removed" from state and client handles redirect.
            this.removePlayer(targetId);

            // If we have reference to their socket, we could force disconnect.
            // But Room doesn't store socket directly cleanly (it has it in closure maybe but not easily accessible here without map).
            // Actually we passed socket to addPlayer but didn't store it in Player class.
            // Ideally Player class should store socket or socketId.
            // For now, client will receive "room-state" where they are missing, and redirect?
            // RoomPage checks: if (!gameState.players.find(me)) -> redirect.
        }
    }

    handleDrawingRating(playerId: string, rating: 'like' | 'dislike') {
        const player = this.players.get(playerId);
        if (!player) return;

        // Prevent drawer from rating their own drawing (though UI should hide it)
        if (this.currentDrawer === playerId) return;

        // Allow multiple ratings? Maybe throttle?
        // For simplicity, we just broadcast. 
        // We could store "hasRated" per turn if we want to limit to 1 per turn.
        // Let's limit to 1 per turn for spam protection.
        // We can add a temporary property to player or just rely on client + simple rate limit.
        // Let's just rely on a simple check.

        // Broadcast to chat
        const action = rating === 'like' ? 'liked' : 'disliked';

        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: `${player.name} ${action} the drawing!`,
            type: 'feedback', // specialized type for styling if needed
            rating: rating
        });
    }

    // ---------- Reconnection Support ----------

    /**
     * Mark a player as disconnected (grace period) rather than removing immediately.
     */
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

        // If the disconnected player is the drawer, skip their turn
        if (this.currentDrawer === playerId && this.state === GameState.DRAWING) {
            console.log(`[Room ${this.id}] Drawer disconnected during drawing. Ending turn.`);
            this.endTurn();
        }
    }

    /**
     * Reconnect a player who was in the grace period.
     * Transfers their state to the new socket ID.
     */
    reconnectPlayer(oldPlayerId: string, newSocketId: string, name: string, socket: Socket, avatar?: any): boolean {
        const player = this.players.get(oldPlayerId);
        if (!player) return false;

        // Transfer the Player to the new socket ID
        this.players.delete(oldPlayerId);
        player.id = newSocketId;
        player.isDisconnected = false;
        player.disconnectedAt = null;
        if (avatar) player.avatar = avatar;
        this.players.set(newSocketId, player);

        // Update host reference if needed
        if (this.hostId === oldPlayerId) {
            this.hostId = newSocketId;
        }

        // Update drawer reference if needed
        if (this.currentDrawer === oldPlayerId) {
            this.currentDrawer = newSocketId;
        }

        // Join the socket.io room
        socket.join(this.id);

        console.log(`[Room ${this.id}] Player ${name} reconnected (${oldPlayerId} -> ${newSocketId})`);

        this.io.to(this.id).emit('chat-message', {
            sender: 'System',
            text: `${name} reconnected!`,
            type: 'system'
        });

        this.broadcastState();
        return true;
    }
}
