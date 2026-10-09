import { io } from 'socket.io-client';

const SOCKET_SERVER_URL =
  import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  /**
   * Initialize or retrieve the Socket.IO client instance
   * @param {string} token - JWT authentication token
   * @returns {import('socket.io-client').Socket}
   */
  connect(token) {
    if (!token) {
      console.warn('[SocketService] Connect called without token');
      return null;
    }

    // If socket exists and is connected with the same token, reuse
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Clean up existing disconnected socket
    if (this.socket) {
      this.socket.disconnect();
    }

    console.log('[SocketService] Connecting to WebSocket server:', SOCKET_SERVER_URL);

    this.socket = io(SOCKET_SERVER_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected successfully! Socket ID:', this.socket.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[SocketService] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
    });

    return this.socket;
  }

  /**
   * Join an isolated document room
   * @param {string} documentId
   * @returns {Promise<{ success: boolean, userRole?: string, error?: string }>}
   */
  joinDocument(documentId) {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        return resolve({ success: false, error: 'Socket is not connected' });
      }

      this.socket.emit('join-document', { documentId }, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Leave a document room
   * @param {string} documentId
   */
  leaveDocument(documentId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-document', { documentId });
    }
  }

  /**
   * Disconnect socket client
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[SocketService] Socket disconnected cleanly');
    }
  }

  /**
   * Listen to an event
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove an event listener
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Get raw socket instance
   */
  getRawSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();