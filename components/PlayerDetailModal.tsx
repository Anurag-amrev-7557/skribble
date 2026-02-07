import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from './Avatar';
import { Trophy, Star, Pencil, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Player {
    id: string;
    name: string;
    score: number;
    lastTurnScore: number;
    avatar: any;
    isDrawer: boolean;
}

interface PlayerDetailModalProps {
    player: Player;
    rank: number;
    onClose: () => void;
    onVoteKick: (playerId: string) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, rank, onClose, onVoteKick }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 border border-white/20 shadow-2xl rounded-2xl p-6 w-full max-w-sm m-4 transform transition-all scale-100 flex flex-col items-center gap-4 relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Rank Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Trophy size={12} fill="currentColor" />
                    Rank #{rank}
                </div>

                {/* Avatar */}
                <div className="w-24 h-24 relative mt-2">
                    <Avatar config={player.avatar} size={96} />
                    {player.isDrawer && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg" title="Currently Drawing">
                            <Pencil size={14} />
                        </div>
                    )}
                </div>

                {/* Name & Status */}
                <div className="text-center">
                    <h3 className="text-2xl font-black tracking-tight flex items-center justify-center gap-2">
                        {player.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">
                        {player.isDrawer ? 'Currently Drawing' : 'Guesser'}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    <div className="bg-muted/50 rounded-xl p-3 flex flex-col items-center justify-center border border-black/5 dark:border-white/5">
                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Score</div>
                        <div className="text-xl font-black">{player.score}</div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 flex flex-col items-center justify-center border border-black/5 dark:border-white/5">
                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Last Round</div>
                        <div className={`text-xl font-black ${player.lastTurnScore > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {player.lastTurnScore > 0 ? `+${player.lastTurnScore}` : '-'}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full mt-2">
                    <Button
                        variant="destructive"
                        className="flex-1 h-9 text-xs font-bold"
                        onClick={() => {
                            onVoteKick(player.id);
                            onClose();
                        }}
                    >
                        Vote Kick 🚫
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
