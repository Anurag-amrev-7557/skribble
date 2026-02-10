import React from 'react';
import { Avatar } from './Avatar';
import { GameTimer } from './GameTimer';
import { RoundResultIllustration } from "@/components/illustrations/RoundResultIllustration";
import { AlarmClock } from "lucide-react";

interface Player {
    id: string;
    name: string;
    score: number;
    lastTurnScore: number;
    avatar: any;
    isDrawer: boolean;
}

interface RoundResultOverlayProps {
    word: string;
    players: Player[];
    // timeRemaining: number; // Removed prop
}

export const RoundResultOverlay: React.FC<RoundResultOverlayProps> = ({ word, players }) => {
    // Sort players by round score (descending), then total score
    const sortedPlayers = [...players].sort((a, b) => {
        if (b.lastTurnScore !== a.lastTurnScore) {
            return b.lastTurnScore - a.lastTurnScore;
        }
        return b.score - a.score;
    });

    return (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-50 animate-in fade-in duration-300 p-4 text-center">
            {/* Header */}
            <RoundResultIllustration />
            <div className="text-white/80 text-base md:text-lg mb-4 md:mb-6">
                The word was <span className="font-extrabold text-green-400">{word}</span>
            </div>

            {/* Scores List - Floating style like word selection buttons */}
            <div className="flex flex-col gap-2 w-full max-w-md shrink min-h-0 overflow-y-auto px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {sortedPlayers.map((player) => (
                    <div
                        key={player.id}
                        className="flex items-center justify-between px-4 py-2.5 rounded-lg transition-all border-b border-white/5 last:border-0"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-8 md:w-10">
                                <Avatar config={player.avatar} size={32} />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <div className="font-bold text-sm md:text-base leading-tight flex items-center gap-1.5">
                                    {player.name}
                                    {player.isDrawer && <span className="text-[10px] bg-white/20 px-1 rounded text-white/80 uppercase tracking-wider">Drawer</span>}
                                </div>
                                <div className="text-[10px] md:text-xs text-white/50">{player.score} pts</div>
                            </div>
                        </div>

                        <div className="font-black text-lg md:text-xl">
                            {player.lastTurnScore > 0 ? (
                                <span className="text-green-400">
                                    +{player.lastTurnScore}
                                </span>
                            ) : (
                                <span className="text-white/20 text-base">
                                    +0
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-white/40 text-sm font-mono whitespace-nowrap flex items-center gap-1">
                Next round in <GameTimer />s...
            </div>
        </div>
    );
};
