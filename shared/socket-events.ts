export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    points: Point[];
    color: string;
    width: number;
    tool?: 'pen' | 'eraser';
}

export interface FillAction {
    type: 'fill';
    x: number;
    y: number;
    color: string;
}

export interface StrokeAction {
    type: 'stroke';
    points: Point[];
    color: string;
    width: number;
}

export type DrawAction = StrokeAction | FillAction;

export interface PlayerState {
    id: string;
    name: string;
    score: number;
    lastTurnScore: number;
    isDrawer: boolean;
    hasGuessed: boolean;
    avatar: any;
    isDisconnected: boolean;
}

export interface GameSettings {
    roundTime: number;
    wordCount: number;
    gameMode: 'NORMAL' | 'HIDDEN' | 'COMBINATION';
    hints: boolean;
    customWords: string[];
    useCustomWords: boolean;
    maxPlayers: number;
    totalRounds?: number;
}

export enum GameState {
    WAITING = 'WAITING',
    SELECTING_WORD = 'SELECTING_WORD',
    DRAWING = 'DRAWING',
    ROUND_END = 'ROUND_END',
    GAME_END = 'GAME_END',
}

export interface RoomState {
    id: string;
    players: PlayerState[];
    state: GameState;
    currentDrawer: string | null;
    round: number;
    totalRounds: number;
    timeRemaining: number;
    currentWord: string | null;
    maskedWord: string | null;
    wordOptions: string[] | null;
    isPrivate: boolean;
    hostId: string | null;
    settings: GameSettings;
    drawingHistory: DrawAction[]; // New field for syncing drawing
}

// Socket Event Interfaces

export interface ServerToClientEvents {
    'room-state': (state: RoomState) => void;
    'chat-message': (msg: { sender: string; text: string; type: 'system' | 'chat' | 'feedback' | 'guess'; rating?: 'like' | 'dislike' }) => void;
    'timer-update': (time: number) => void;
    'draw-stroke': (stroke: Stroke) => void;
    'fill-canvas': (action: { x: number; y: number; color: string }) => void;
    'clear-canvas': () => void;
    'undo-last-stroke': () => void;
    'choose-word': (words: string[]) => void;
    'reveal-word': (data: { word: string }) => void;
    'error': (msg: string) => void;
}

export interface ClientToServerEvents {
    'create-room': (data: { name: string; userId: string; avatar?: any; isPrivate?: boolean }, callback: (res: { success: boolean; roomId?: string; error?: string }) => void) => void;
    'join-room': (data: { roomId: string; userId: string; name: string; avatar?: any }, callback: (res: { success: boolean; roomState?: RoomState; error?: string }) => void) => void;
    'rejoin-room': (data: { roomId: string; userId: string; name: string; avatar?: any; oldSocketId?: string }, callback: (res: { success: boolean; roomState?: RoomState; reconnected?: boolean; error?: string }) => void) => void;
    'find-available-room': (callback: (res: { success: boolean; roomId?: string; error?: string }) => void) => void;
    'start-game': (data: { roomId: string }) => void;
    'chat-message': (data: { roomId: string; text: string }) => void;
    'draw-stroke': (data: { roomId: string; stroke: Stroke }) => void;
    'fill-canvas': (data: { roomId: string; x: number; y: number; color: string }) => void;
    'clear-canvas': (data: { roomId: string }) => void;
    'undo-last-stroke': (data: { roomId: string }) => void;
    'select-word': (data: { roomId: string; word: string }) => void;
    'rate-drawing': (data: { roomId: string; rating: 'like' | 'dislike' }) => void;
    'vote-kick': (data: { roomId: string; targetId: string }) => void;
    'update-room-settings': (data: { roomId: string; settings: Partial<GameSettings> }) => void;
    'request-restart': (data: { roomId: string }) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    name: string;
    roomId: string;
}
