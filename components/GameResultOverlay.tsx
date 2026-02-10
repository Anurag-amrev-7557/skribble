import React from 'react';
import { Button } from './ui/button';
import Link from 'next/link';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { GameEndIllustration } from "@/components/illustrations/GameEndIllustration";

interface Player {
    id: string;
    name: string;
    score: number;
    avatar: any;
}

interface GameResultOverlayProps {
    players: Player[];
    isHost: boolean;
    currentPlayerId: string;
    onBackToLobby: () => void;
    onRestart: () => void;
}

export const GameResultOverlay: React.FC<GameResultOverlayProps> = ({ players, isHost, currentPlayerId, onBackToLobby, onRestart }) => {
    // Sort players by total score (descending)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
        <div className="absolute inset-0 z-50 animate-in fade-in duration-500 flex flex-col overflow-hidden">
            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col items-center py-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                {/* Header Section - Minimal */}
                <div className="flex items-center justify-around shrink-0 mb-6 w-full">
                    <GameEndIllustration />
                    <div className="flex flex-col items-center">
                        <h2 className="text-4xl font-bold mb-2 tracking-tight">
                            Game Over
                        </h2>
                        <div className="text-xl opacity-70">
                            Winner: <span className="text-green-400 font-bold">{winner.name}</span>
                        </div>
                    </div>
                </div>

                {/* Minimalist Leaderboard */}
                <div className="flex flex-col gap-1 w-full max-w-md shrink-0 mb-4">
                    <div className="flex justify-between text-xs uppercase tracking-widest opacity-50 border-b border-white/10 pb-2 mb-2 px-2">
                        <span>Rank</span>
                        <span>Score</span>
                    </div>
                    {sortedPlayers.map((player, index) => (
                        <div
                            key={player.id}
                            className={`flex items-center justify-between px-2 py-1 transition-opacity ${index === 0 ? 'text-green-500 font-bold' : 'opacity-80 hover:opacity-100'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="w-6 text-right opacity-50">#{index + 1}</span>
                                <span className="text-lg truncate max-w-[200px] flex items-center gap-2">
                                    {player.name}
                                    {player.id === currentPlayerId && (
                                        <span className="text-[10px] bg-black/10 px-1 rounded text-black/60 font-bold">(YOU)</span>
                                    )}
                                </span>
                            </div>
                            <span className="text-lg tabular-nums">{player.score}</span>
                        </div>
                    ))}
                </div>

                {/* Footer Actions - Minimal */}
                <div className="flex gap-4 shrink-0 justify-center w-full max-w-sm absolute bottom-4">
                    <Link href="/" className="flex-1">
                        <Button
                            variant="ghost"
                            className="w-full h-12 hover:text-white hover:bg-black/10 border bg-white border-black/10 rounded-full uppercase tracking-widest text-xs font-bold"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Lobby
                        </Button>
                    </Link>
                    <Button
                        onClick={onRestart}
                        className="flex-1 h-12 bg-black text-white hover:bg-black/90 rounded-none uppercase rounded-full tracking-widest text-xs font-bold"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restart
                    </Button>
                </div>
            </div>
        </div>
    );
};
