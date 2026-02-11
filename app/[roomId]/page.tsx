"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { socket } from "@/lib/socket";
import { CanvasBoard, CanvasBoardRef } from "@/components/CanvasBoard";
import { ChatBox } from "@/components/ChatBox";
import { RoundResultOverlay } from "@/components/RoundResultOverlay";
import { GameResultOverlay } from "@/components/GameResultOverlay";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarConfig } from "@/components/Avatar";
import { DrawingToolbar } from "@/components/DrawingToolbar";
import { RoomSettings } from "@/components/RoomSettings";
import { GameTimer } from "@/components/GameTimer";
import { Brain, Palette, Sparkles, Clock, Check, Pencil, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { useGameSounds } from "@/hooks/useGameSounds";
import { Transition } from "@/components/ui/Transition";
import { WordChoosingIllustration } from "@/components/illustrations/WordChoosingIllustration";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function RoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const searchParams = useSearchParams();
    const playerName = searchParams.get("name") || "Guest";
    const avatarRaw = searchParams.get("avatar");

    const initialAvatar: AvatarConfig = avatarRaw ? JSON.parse(decodeURIComponent(avatarRaw)) : { skinColor: "#FFDFC4", eyes: 0, mouth: 0, accessory: 0 };

    // Drawing State
    const canvasRef = useRef<CanvasBoardRef>(null);
    const [color, setColor] = useState("#000000");
    const [lineWidth, setLineWidth] = useState(5);
    const [tool, setTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Detect mobile keyboard via visualViewport API
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

        const handleResize = () => {
            if (isIOS) {
                const offsetFromBottom = window.innerHeight - vv.height - vv.offsetTop;
                setKeyboardHeight(Math.max(0, offsetFromBottom));
            } else {
                setKeyboardHeight(0);
            }
        };

        vv.addEventListener('resize', handleResize);
        vv.addEventListener('scroll', handleResize);
        return () => {
            vv.removeEventListener('resize', handleResize);
            vv.removeEventListener('scroll', handleResize);
        };
    }, []);


    const [gameState, setGameState] = useState<any>({
        players: [],
        state: 'WAITING',
        currentDrawer: null,
        round: 1,
        totalRounds: 3,
        // timeRemaining: 0, // Removed from main state to prevent re-renders
        currentWord: null,
        maskedWord: null
    });

    const [wordOptions, setWordOptions] = useState<string[]>([]);
    const [revealedWord, setRevealedWord] = useState<string | null>(null);
    const { playSound } = useGameSounds();

    // ---------- Connection & Reconnection Logic ----------
    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        // Attempt rejoin if we have an old socket ID (page refresh / reconnect)
        const oldSocketId = sessionStorage.getItem(`skribble-socket-${roomId}`);
        const joinEvent = oldSocketId ? 'rejoin-room' : 'join-room';
        const joinPayload = oldSocketId
            ? { roomId, name: playerName, avatar: initialAvatar, oldSocketId }
            : { roomId, name: playerName, avatar: initialAvatar };

        socket.emit(joinEvent, joinPayload, (response: any) => {
            if (response.success) {
                setGameState(response.roomState);
                // Store current socket ID for future reconnections
                if (socket.id) {
                    sessionStorage.setItem(`skribble-socket-${roomId}`, socket.id);
                }
                playSound('join');
            } else {
                window.location.href = '/';
            }
        });

        // On reconnect, re-emit rejoin to restore room membership
        const handleReconnect = () => {
            const prevId = sessionStorage.getItem(`skribble-socket-${roomId}`);
            socket.emit('rejoin-room', {
                roomId,
                name: playerName,
                avatar: initialAvatar,
                oldSocketId: prevId,
            }, (response: any) => {
                if (response.success) {
                    setGameState(response.roomState);
                    if (socket.id) {
                        sessionStorage.setItem(`skribble-socket-${roomId}`, socket.id);
                    }
                } else {
                    window.location.href = '/';
                }
            });
        };

        socket.on("connect", handleReconnect);

        socket.on("room-state", (newState: any) => {
            setGameState(newState);
            // Keep socket ID in sync
            if (socket.id) {
                sessionStorage.setItem(`skribble-socket-${roomId}`, socket.id);
            }
        });
        socket.on("choose-word", setWordOptions);
        socket.on("reveal-word", ({ word }: { word: string }) => {
            setRevealedWord(word);
        });

        // Clear word options on round end to be safe
        if (gameState.state === 'ROUND_END') {
            setWordOptions([]);
        }

        return () => {
            socket.off("connect", handleReconnect);
            socket.off("room-state");
            socket.off("choose-word");
            socket.off("reveal-word");
        };
    }, [roomId, playerName]);

    // Sound Effects & State Resets for Game State Changes
    useEffect(() => {
        // Reset revealed word when starting a new turn/round or waiting
        if (gameState.state === 'SELECTING_WORD' || gameState.state === 'DRAWING' || gameState.state === 'WAITING') {
            setRevealedWord(null);
        }

        if (gameState.state === 'GAME_END') {
            playSound('game-end');
        } else if (gameState.state === 'SELECTING_WORD') {
            playSound('turn-start');
        }
    }, [gameState.state, gameState.currentDrawer, playSound]);

    const handleSelectWord = (word: string) => {
        socket.emit("select-word", { roomId, word });
        setWordOptions([]);
    };

    const handleUpdateSettings = (newSettings: any) => {
        socket.emit("update-room-settings", { roomId, settings: newSettings });
    };

    const handleStartGame = () => {
        socket.emit("start-game", { roomId });
    };

    const handleInvite = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert("Room link copied to clipboard!");
    };

    if (!gameState) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p>Loading Game Room...</p>
                <Button onClick={() => window.location.href = '/'}>Back to Lobby</Button>
            </div>
        );
    }


    const isDrawer = gameState.currentDrawer === socket.id;
    const isPrivateRoomLobby = gameState.isPrivate && gameState.state === 'WAITING';
    const isHost = gameState.hostId === socket.id;

    return (
        <div className={`grid h-[100dvh] bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-background to-background dark:from-indigo-950/30 dark:via-background dark:to-background overflow-hidden font-sans text-foreground selection:bg-primary/20 relative 
            grid-cols-2 ${isInputFocused && !isDrawer
                ? 'grid-rows-[1fr_auto]' // Focused: Header+Canvas (1fr), Input (auto)
                : isDrawer
                    ? 'grid-rows-[auto_auto_1fr_auto]' // Drawer: Header, Toolbar, Canvas, Chat
                    : 'grid-rows-[auto_1fr_auto]'} // Default: Header+Canvas, Players/Chat, Input
            md:grid-cols-[300px_1fr_320px] md:grid-rows-1 overscroll-none`}>

            {/* Connection Status Indicator */}
            <ConnectionStatus />

            {/* players AREA */}
            <div className={`
                ${isInputFocused ? 'hidden md:flex' : (isDrawer ? 'row-start-3' : 'row-start-2')} col-start-1 
                md:row-start-1 md:col-start-1 
                w-full h-full flex flex-col md:p-4 z-20 shrink-0 bg-white/50 dark:bg-black/20 border-r border-t border-black/20 overflow-hidden`}>
                <div className="mb-2 md:mb-6 px-1 md:px-2 hidden md:block">
                    <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity block">
                        <h1 className="font-extrabold text-3xl tracking-tighter bg-gradient-to-br from-primary to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
                            Skribble<span className="text-foreground">.io</span>
                        </h1>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 md:space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mb-1 md:mb-2 px-1 hidden md:block">Players ({gameState.players.length})</div>
                    {[...gameState.players]
                        .sort((a: any, b: any) => b.score - a.score)
                        .map((p: any, i: number) => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedPlayer(p)} // Set selected player on click
                                className={`cursor-pointer group relative flex items-center gap-2 md:gap-3 p-1 md:p-2 mb-0 transition-all duration-300 border-b hover:shadow-md hover:scale-[1.02] ${p.isDisconnected ? 'opacity-50' : ''} ${p.hasGuessed
                                    ? (i % 2 === 0 ? 'bg-green-400/70 dark:bg-green-600/60' : 'bg-green-300/70 dark:bg-green-700/50')
                                    : (p.id === socket.id ? 'bg-primary/5' : (i % 2 === 0 ? 'bg-black/5' : 'bg-transparent'))
                                    } ${p.id === socket.id
                                        ? "border-primary/50 shadow-sm ring-1 ring-primary/20"
                                        : "border-transparent"
                                    }`}
                            >
                                <div className="font-mono text-xs md:text-sm text-muted-foreground w-5 md:w-6 shrink-0">
                                    #{i + 1}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center items-center">
                                    <div className="flex items-center gap-1">
                                        <p className="text-[12px] font-semibold md:text-sm truncate max-w-[80px] md:max-w-[110px]">{p.name}</p>
                                        {p.id === socket.id && <span className="text-primary text-[8px] md:text-[10px] shrink-0">(YOU)</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[12px] md:text-xs text-muted-foreground">{p.score} pts</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {p.isDrawer && (
                                        <div title="Drawing Now" className="text-black">
                                            <Pencil className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                    )}
                                    {/* Host Crown */}

                                    <div className="w-8 h-8 md:w-9 md:h-9 relative">
                                        <Avatar config={p.avatar || { skinColor: "#FFDFC4", eyes: 0, mouth: 0, accessory: 0 }} size={36} />
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>

                {/* Player Detail Modal */}
                {selectedPlayer && (
                    <PlayerDetailModal
                        player={selectedPlayer}
                        rank={[...gameState.players].sort((a: any, b: any) => b.score - a.score).findIndex((p: any) => p.id === selectedPlayer.id) + 1}
                        onClose={() => setSelectedPlayer(null)}
                        onVoteKick={(targetId) => {
                            socket.emit("vote-kick", { roomId, targetId });
                            // Optional: play sound or show toast
                            // playSound('chat'); // maybe
                        }}
                    />
                )}
            </div>

            {/* Main Area: Header + Canvas */}
            <div className={`
                row-start-1 col-span-2 
                md:row-start-1 md:col-start-2 md:col-span-1 
                flex flex-col relative 
                ${isInputFocused && !isDrawer ? 'h-full row-span-1' : 'h-[60vh]'} 
                md:h-auto border-b md:border-b-0 border-black/10 transition-all duration-300`}>

                {/* Header (Floating) */}
                <div className="h-16 md:h-20 flex items-center justify-between px-2 md:px-8 z-20 shrink-0 border-b md:border-b-0 border-black/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md md:bg-transparent transition-all duration-300">
                    {/* LEFT: Clock + Round */}
                    <div className="flex items-center">
                        <div className="md:hidden flex flex-col items-center gap-0.5">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-foreground/80"><circle cx="12" cy="12" r="9" /></svg>
                                <span className={`absolute inset-0 flex items-center justify-center text-xs`}>
                                    <GameTimer
                                        render={(time) => <span className={time < 10 ? 'text-red-500' : 'text-foreground'}>{time}</span>}
                                    />
                                </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-none">Round {gameState.round} of {gameState.totalRounds}</div>
                        </div>
                        <div className="hidden md:flex bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md border shadow-sm rounded-2xl px-4 py-2 items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Round</span>
                                <div className="text-xl font-black leading-none">{gameState.round}<span className="text-muted-foreground text-sm font-medium">/{gameState.totalRounds}</span></div>
                            </div>
                            <div className="w-px h-8 bg-border" />
                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => navigator.clipboard.writeText(roomId)} title="Copy Code">
                                <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Room Code</span>
                                    <div className="text-sm font-mono leading-none">{roomId}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CENTER: Word Display */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:top-4 md:translate-y-0 w-auto">
                        <div className="flex flex-col items-center">
                            <div className="md:hidden flex flex-col items-center">
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{gameState.state === 'WAITING' ? 'WAITING' : isDrawer ? 'DRAW THIS' : 'GUESS THIS'}</div>
                                {isDrawer ? (
                                    <div className="text-lg font-black tracking-widest text-foreground">{gameState.currentWord || "..."}</div>
                                ) : (
                                    <div className="text-lg font-black tracking-widest flex gap-1 text-foreground">
                                        {(revealedWord || gameState.maskedWord || "").split('').map((char: string, i: number) => {
                                            const isSpace = char === ' ';
                                            const isRevealed = !!revealedWord;
                                            return (
                                                <span
                                                    key={`${i}-${char}`}
                                                    className={`text-center border-b-2 leading-none transition-all duration-300 
                                                    ${isSpace ? 'w-3 border-transparent' : 'w-3'}
                                                    ${!isSpace && char !== '_'
                                                            ? 'border-primary/50 text-foreground animate-in fade-in slide-in-from-bottom-1 zoom-in-50 duration-300'
                                                            : (isSpace ? 'border-transparent' : 'border-foreground/50 text-transparent')}
                                                    ${isRevealed && !isSpace ? 'text-green-600 dark:text-green-400' : ''}`}
                                                >
                                                    {char === '_' ? '\u00A0' : char}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="hidden md:flex bg-white dark:bg-zinc-900 shadow-xl rounded-2xl px-8 py-3 border-b-4 border-primary/20 flex-col items-center min-w-[300px] transition-all duration-500 scale-100">
                                {gameState.state === 'WAITING' ? (
                                    <div className="text-sm tracking-widest text-muted-foreground animate-pulse">WAITING TO START...</div>
                                ) : isDrawer ? (
                                    <>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">DRAW THIS</div>
                                        <div className="text-2xl font-black tracking-widest text-foreground animate-in fade-in zoom-in duration-300">{gameState.currentWord || "..."}</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">GUESS THIS</div>
                                        <div className="text-2xl font-black tracking-widest flex gap-3 text-foreground/80">
                                            {(revealedWord || gameState.maskedWord || "").split('').map((char: string, i: number) => {
                                                const isRevealed = revealedWord || (gameState.maskedWord && gameState.maskedWord[i] !== '_');
                                                const isSpace = char === ' ';
                                                // If revealedWord is set, ALL are revealed.
                                                // If just maskedWord, only non-underscore are revealed.
                                                // We want to animate if it wasn't revealed before? 
                                                // Simple animation: key by index, if char changes from _ to Letter, animate.
                                                return (
                                                    <span key={`${i}-${char}`} className={`
                                                        border-b-[3px] text-center transition-all duration-300 transform
                                                        ${isSpace ? 'w-6 border-transparent' : 'w-8'}
                                                        ${!isSpace && char !== '_'
                                                            ? 'border-primary/50 text-foreground -translate-y-1 animate-in fade-in slide-in-from-bottom-2 zoom-in-50 duration-500'
                                                            : (isSpace ? 'border-transparent' : 'border-foreground/20 text-transparent')}
                                                        ${revealedWord && char !== '_' && !isSpace ? 'text-green-600 dark:text-green-400 scale-110' : ''}
                                                    `}>
                                                        {char === '_' ? '\u00A0' : char}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Settings */}
                    <div className="flex items-center">
                        <div className="md:hidden">
                            <Button variant="ghost" size="icon" className="h-12 w-12">
                                <svg xmlns="http://www.w3.org/2000/svg" className="scale-120" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                            </Button>
                        </div>
                        <div className="hidden md:flex bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md border shadow-sm rounded-2xl p-2 pr-4 items-center gap-3">
                            <GameTimer
                                render={(time) => (
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${time < 10 ? "bg-red-500 text-white animate-pulse" : "bg-zinc-100 dark:bg-zinc-800 text-foreground"}`}>
                                        {time}
                                    </div>
                                )}
                            />
                            <div className="flex flex-col"><span className="text-[10px] uppercase text-muted-foreground tracking-wider">Time</span><span className="text-xs font-semibold">Seconds</span></div>
                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 md:p-6 pt-0 flex items-center justify-center relative overflow-hidden">
                    <div className="w-full h-full max-w-[1200px] bg-white md:rounded-3xl shadow-lg md:shadow-2xl shadow-indigo-500/10 overflow-hidden border-2 md:border-4 border-white dark:border-zinc-800 ring-1 ring-black/5 relative transition-all touch-none">
                        <CanvasBoard
                            ref={canvasRef}
                            roomId={roomId}
                            isDrawer={isDrawer}
                            currentWord={gameState.currentWord}
                            color={color}
                            lineWidth={lineWidth}
                            tool={tool}
                        />

                        {/* Private Room Lobby Overlay */}
                        {isPrivateRoomLobby && (
                            <div className="absolute inset-0 bg-background z-40 flex flex-col">
                                <RoomSettings
                                    settings={gameState.settings || {}}
                                    isHost={isHost}
                                    onUpdate={handleUpdateSettings}
                                    onStart={handleStartGame}
                                    onInvite={handleInvite}
                                />
                            </div>
                        )}

                        {/* Desktop Toolbar Overlay */}
                        {isDrawer && (
                            <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
                                <div className="pointer-events-auto">
                                    <DrawingToolbar
                                        color={color}
                                        setColor={setColor}
                                        tool={tool}
                                        setTool={setTool}
                                        lineWidth={lineWidth}
                                        setLineWidth={setLineWidth}
                                        onClear={() => canvasRef.current?.clear()}
                                        onUndo={() => canvasRef.current?.undo()}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Like/Dislike Buttons (Non-Drawer only, during Drawing) */}
                        {!isDrawer && gameState.state === 'DRAWING' && (
                            <div className="absolute top-4 right-4 flex flex-col gap-2 z-30 pointer-events-auto">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-10 w-10 rounded-full shadow-md bg-white/90 hover:bg-white hover:scale-110 transition-all active:scale-95"
                                    onClick={() => {
                                        socket.emit('rate-drawing', { roomId, rating: 'like' });
                                    }}
                                    title="Like Drawing"
                                >
                                    <ThumbsUp className="w-5 h-5 text-green-600" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-10 w-10 rounded-full shadow-md bg-white/90 hover:bg-white hover:scale-110 transition-all active:scale-95"
                                    onClick={() => {
                                        socket.emit('rate-drawing', { roomId, rating: 'dislike' });
                                    }}
                                    title="Dislike Drawing"
                                >
                                    <ThumbsDown className="w-5 h-5 text-red-500" />
                                </Button>
                            </div>
                        )}

                        {/* Overlays (Word Select, Results, etc) */}
                        {/* Word Selection Overlay */}
                        <Transition
                            show={gameState.state === 'SELECTING_WORD'}
                            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-50 p-4 text-center"
                        >
                            {isDrawer ? (
                                <>
                                    <div className="mb-4 md:mb-6">
                                        <WordChoosingIllustration />
                                    </div>
                                    <div className="text-xl md:text-3xl font-black mb-4 md:mb-8 tracking-tight">Choose a Word to Draw!</div>
                                    <div className="flex flex-wrap gap-2 md:gap-4 justify-center max-w-2xl">
                                        {wordOptions.map((word) => (
                                            <Button key={word} onClick={() => handleSelectWord(word)} className="h-10 md:h-14 px-4 md:px-8 text-sm md:text-2xl rounded-full bg-white shadow-lg text-black hover:bg-white hover:text-black">{word}</Button>
                                        ))}
                                    </div>
                                    <div className="mt-8 text-white/50 animate-pulse text-sm font-mono whitespace-nowrap flex items-center gap-1">
                                        Auto-selecting in <GameTimer />s...
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <WordChoosingIllustration />
                                    </div>
                                    <h2 className="text-lg md:text-3xl font-black tracking-tight text-center">{gameState.players.find((p: any) => p.isDrawer)?.name || "Drawer"} is choosing a word...</h2>
                                    <p className="text-white/50 mt-4">Get ready to guess!</p>
                                </>
                            )}
                        </Transition>

                        {/* Round Result Overlay */}
                        <Transition
                            show={gameState.state === 'ROUND_END'}
                            className="absolute inset-0 z-50"
                        >
                            <RoundResultOverlay
                                word={gameState.currentWord || "Unknown"}
                                players={gameState.players}
                            />
                        </Transition>

                        {/* Game End Overlay */}
                        <Transition
                            show={gameState.state === 'GAME_END'}
                            className="absolute inset-0 z-50"
                        >
                            <GameResultOverlay
                                players={gameState.players}
                                isHost={isHost}
                                currentPlayerId={socket.id || ""}
                                onBackToLobby={() => window.location.href = '/'}
                                onRestart={() => socket.emit("request-restart", { roomId })}
                            />
                        </Transition>
                    </div>
                </div>
            </div>

            {/* Mobile Drawing Toolbar (Separate Row) */}
            {isDrawer && !isPrivateRoomLobby && !isInputFocused && (
                <div className={`
                    row-start-2 col-span-2 
                    md:hidden 
                    w-full bg-background border-y border-black/10 flex items-center justify-center p-0 md:p-2 z-30`}>
                    <DrawingToolbar
                        color={color}
                        setColor={setColor}
                        tool={tool}
                        setTool={setTool}
                        lineWidth={lineWidth}
                        setLineWidth={setLineWidth}
                        onClear={() => canvasRef.current?.clear()}
                        onUndo={() => canvasRef.current?.undo()}
                        className="flex-row w-full h-full justify-between gap-0 rounded-none border-none shadow-none bg-transparent px-2"
                    />
                </div>
            )}

            {/* Chat Area */}
            <div className={`
                ${isInputFocused ? 'hidden md:flex' : (isDrawer ? 'row-start-3' : 'row-start-2')} col-start-2 
                md:row-start-1 md:col-start-3 
                w-full h-full flex flex-col z-20 shrink-0 bg-white/50 dark:bg-black/20 border-l border-t border-black/20 overflow-hidden`}>
                <ChatBox roomId={roomId} playerName={playerName} onSound={playSound} />
            </div>

            {/* Mobile Input Bar */}
            <div
                className={`
                ${isInputFocused ? 'fixed left-0 right-0 z-[9999]' : (isDrawer ? 'row-start-4' : 'row-start-3') + ' col-span-2'}
                md:hidden
                w-full bg-background border-t transition-all duration-200`}
                style={isInputFocused ? { bottom: `${keyboardHeight}px` } : undefined}
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('mobile-guess') as HTMLInputElement;
                    const text = input.value.trim();
                    if (!text) return;
                    socket.emit("chat-message", { roomId, text });
                    input.value = "";
                }} className="flex">
                    <input
                        name="mobile-guess"
                        type="text"
                        placeholder="Type your guess here..."
                        className="flex-1 h-12 px-4 bg-muted/50 focus:outline-none shadow-sm"
                        autoComplete="off"
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setTimeout(() => setIsInputFocused(false), 100)}


                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="w-12 h-[49px] rounded-[0px] -mt-[1px]"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="scale-120" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                    </Button>
                </form>
            </div>
        </div>
    );
}
