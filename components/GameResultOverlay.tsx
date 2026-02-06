
import React from 'react';
import { Avatar } from './Avatar';
import { Button } from './ui/button';
import Link from 'next/link';

interface Player {
    id: string;
    name: string;
    score: number;
    avatar: any;
}

interface GameResultOverlayProps {
    players: Player[];
    onBackToLobby: () => void;
}

export const GameResultOverlay: React.FC<GameResultOverlayProps> = ({ players, onBackToLobby }) => {
    // Sort players by total score (descending)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-50 animate-in fade-in duration-500 p-4 text-center backdrop-blur-sm">
            {/* Header */}
            <div className="text-4xl md:text-7xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-500 drop-shadow-sm">
                Game Over!
            </h2>
            <div className="text-white/80 text-lg md:text-xl mb-8">
                The winner is <span className="font-extrabold text-yellow-400">{winner.name}</span>!
            </div>

            {/* Winner Spotlight */}
            <div className="mb-8 relative">
                <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative transform hover:scale-110 transition-transform duration-300">
                    <Avatar config={winner.avatar} size={120} />
                    <div className="absolute -top-6 -right-6 text-5xl rotate-12">👑</div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="flex flex-col gap-3 w-full max-w-lg max-h-[40vh] overflow-y-auto px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {sortedPlayers.map((player, index) => (
                    <div
                        key={player.id}
                        className={`flex items-center justify-between px-6 py-4 rounded-xl transition-all border 
                            ${index === 0
                                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`font-mono font-bold text-lg md:text-xl w-8 ${index === 0 ? 'text-yellow-400' : 'text-white/50'}`}>
                                #{index + 1}
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center p-1">
                                <Avatar config={player.avatar} size={40} />
                            </div>
                            <div className="font-bold text-lg md:text-xl text-left">
                                {player.name}
                                {index === 0 && <span className="ml-2 text-xs text-yellow-500 uppercase tracking-widest font-black">Winner</span>}
                            </div>
                        </div>

                        <div className="font-black text-xl md:text-2xl tracking-tight">
                            {player.score} <span className="text-sm font-medium text-white/50">pts</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="mt-10 flex gap-4">
                <Link href="/">
                    <Button
                        size="lg"
                        className="font-bold text-lg px-8 h-14 bg-white text-black hover:bg-gray-200 transition-all hover:scale-105"
                    >
                        Back to Lobby
                    </Button>
                </Link>
            </div>
        </div>
    );
};
