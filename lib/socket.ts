
"use client";

import { io } from "socket.io-client";

// Initialize socket connection with robust reconnection config
export const socket = io({
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

socket.on("reconnect_attempt", (attempt) => {
    console.log(`[Socket] Reconnection attempt ${attempt}...`);
});

socket.on("reconnect", (attempt) => {
    console.log(`[Socket] Reconnected after ${attempt} attempt(s)`);
});

socket.on("reconnect_error", (err) => {
    console.error("[Socket] Reconnection error:", err.message);
});

socket.on("reconnect_failed", () => {
    console.error("[Socket] All reconnection attempts failed");
});

socket.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
});
