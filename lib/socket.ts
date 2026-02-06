
"use client";

import { io } from "socket.io-client";

// Initialize socket connection
// We use the same origin, so no URL needed if served from same domain
// For dev with custom server on 3000, it works out of box
export const socket = io({
    autoConnect: false,
});
