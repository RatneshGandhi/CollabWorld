import { Server } from 'socket.io';
import { socketAuth } from './socketAuth.js';
import { registerDocumentHandlers } from './documentHandler.js';

let io = null;

/**
 * Initialize and attach Socket.IO to the Node HTTP server
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply JWT authentication to all incoming socket connections
  io.use(socketAuth);

  // Connection listener
  io.on('connection', (socket) => {
    console.log(`[Socket] New connection established: ${socket.id} (User: ${socket.user.name})`);

    // Register document event handlers
    registerDocumentHandlers(io, socket);

    // Ping / Health test event
    socket.on('ping-server', (callback) => {
      if (typeof callback === 'function') {
        callback({ status: 'ok', serverTime: new Date().toISOString() });
      }
    });
  });

  console.log('[Socket] Socket.IO server initialized successfully');
  return io;
};

/**
 * Retrieve the active Socket.IO server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet');
  }
  return io;
};