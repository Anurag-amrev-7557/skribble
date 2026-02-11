
"use client";

import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@/shared/socket-events";

// Initialize socket connection with robust reconnection config
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
    autoConnect: false,

    // Reconnection
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    // Timeouts
    timeout: 10000,

    // Prefer WebSocket, fall back to polling
    transports: ["websocket", "polling"],
});

// ---------- Connection Lifecycle Logging ----------

socket.on("connect", () => {
    console.log("[Socket] Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.warn("[Socket] Disconnected:", reason);
});

socket.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
});
