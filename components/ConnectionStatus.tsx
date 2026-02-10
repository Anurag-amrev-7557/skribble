"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

type ConnectionState = "connected" | "reconnecting" | "disconnected";

export function ConnectionStatus() {
    const [state, setState] = useState<ConnectionState>(
        socket.connected ? "connected" : "disconnected"
    );
    const [attempt, setAttempt] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onConnect = () => {
            setState("connected");
            // Show green briefly then hide
            setVisible(true);
            setTimeout(() => setVisible(false), 2000);
        };

        const onDisconnect = () => {
            setState("disconnected");
            setVisible(true);
        };

        const onReconnectAttempt = (attemptNumber: number) => {
            setState("reconnecting");
            setAttempt(attemptNumber);
            setVisible(true);
        };

        const onReconnect = () => {
            setState("connected");
            setAttempt(0);
            setVisible(true);
            setTimeout(() => setVisible(false), 2000);
        };

        const onReconnectFailed = () => {
            setState("disconnected");
            setVisible(true);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.io.on("reconnect_attempt", onReconnectAttempt);
        socket.io.on("reconnect", onReconnect);
        socket.io.on("reconnect_failed", onReconnectFailed);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.io.off("reconnect_attempt", onReconnectAttempt);
            socket.io.off("reconnect", onReconnect);
            socket.io.off("reconnect_failed", onReconnectFailed);
        };
    }, []);

    if (!visible) return null;

    const config = {
        connected: {
            bg: "bg-green-500/90",
            icon: <Wifi className="w-3.5 h-3.5" />,
            text: "Connected",
        },
        reconnecting: {
            bg: "bg-amber-500/90",
            icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
            text: `Reconnecting${attempt > 1 ? ` (${attempt})` : "..."}`,
        },
        disconnected: {
            bg: "bg-red-500/90",
            icon: <WifiOff className="w-3.5 h-3.5" />,
            text: "Disconnected",
        },
    }[state];

    return (
        <div
            className={`fixed top-3 left-1/2 -translate-x-1/2 z-[9999] ${config.bg} text-white 
                px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm
                flex items-center gap-2 text-xs font-semibold tracking-wide
                animate-in slide-in-from-top-2 fade-in duration-300`}
        >
            {config.icon}
            <span>{config.text}</span>
            {state === "disconnected" && (
                <button
                    onClick={() => socket.connect()}
                    className="ml-1 px-2 py-0.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-[10px] uppercase tracking-wider"
                >
                    Retry
                </button>
            )}
        </div>
    );
}
