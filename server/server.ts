
import express from 'express';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { setupSocketIO } from './socket/socketHandler';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);

  // Initialize Socket.io with robust configuration
  const io = new Server(httpServer, {
    pingInterval: 25000,       // How often to ping clients
    pingTimeout: 20000,        // How long to wait for pong
    maxHttpBufferSize: 1e6,    // 1 MB max message size
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,  // 2 minutes
      skipMiddlewares: true,
    },
  });

  // Setup Socket handlers
  setupSocketIO(io);

  // Handle all other routes with Next.js
  server.all(/.*/, (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
