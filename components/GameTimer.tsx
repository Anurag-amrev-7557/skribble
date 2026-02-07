"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

interface GameTimerProps {
    initialTime?: number;
    onTimeUp?: () => void;
    className?: string; // Allow passing styles
    render?: (time: number) => React.ReactNode; // Optional render prop
}

export const GameTimer = ({ initialTime = 0, onTimeUp, className, render }: GameTimerProps) => {
    const [timeRemaining, setTimeRemaining] = useState(initialTime);

    useEffect(() => {
        // Initial sync could be passed via props, but we also listen for updates
        if (initialTime !== undefined) {
            setTimeRemaining(initialTime);
        }

        const handleTimerUpdate = (time: number) => {
            setTimeRemaining(time);
            if (time <= 0 && onTimeUp) {
                onTimeUp();
            }
        };

        socket.on("timer-update", handleTimerUpdate);

        // Also listen to room-state to resync if needed? 
        // Actually room-state in parent might be enough for initial, but timer-update is frequent.
        // Let's rely on parent passing initialTime if it has it from room state, 
        // but the socket "timer-update" is the source of truth for the ticking.

        return () => {
            socket.off("timer-update", handleTimerUpdate);
        };
    }, [initialTime, onTimeUp]);

    if (render) {
        return <>{render(timeRemaining)}</>;
    }

    // Default rendering if no render prop
    return (
        <div className={className}>
            {timeRemaining}
        </div>
    );
};
