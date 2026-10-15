import { Server } from 'socket.io';
import { socketAuth } from './socketAuth.js';
import { registerDocumentHandlers } from './documentHandler.js';

let io = null;

/**
 * Initialize and attach Socket.IO to the Node HTTP server
 * @param {import('http').Server} httpServer
 * @param {Object} corsOptions - Dynamic CORS settings
 * @returns {import('socket.io').Server}
 */
export const initSocketServer = (httpServer, corsOptions = {}) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin || ((origin, cb) => cb(null, true)),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Apply JWT authentication to all incoming socket connections
  io.use(socketAuth);

  // Connection listener
  io.on('connection', (socket) => {
    console.log(`[Socket] Connection established: ${socket.id} (User: ${socket.user?.name})`);

    // Register document event handlers
    registerDocumentHandlers(io, socket);

    // Ping / Health test event
    socket.on('ping-server', (callback) => {
      if (typeof callback === 'function') {
        callback({ status: 'ok', serverTime: new Date().toISOString() });
      }
    });
  });

  console.log('[Socket] Socket.IO server initialized with dynamic CORS');
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