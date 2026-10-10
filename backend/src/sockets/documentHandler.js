import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents, documentCollaborators } from '../db/schema.js';

/**
 * Register document-specific WebSocket event listeners
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export const registerDocumentHandlers = (io, socket) => {
  /**
   * Handle joining an isolated document room
   * Validates document existence and checks user permissions (Owner or Collaborator)
   */
  socket.on('join-document', async ({ documentId }, callback = () => {}) => {
    try {
      if (!documentId) {
        return callback({ success: false, error: 'Document ID is required' });
      }

      const userId = socket.user.id;

      // 1. Fetch document from PostgreSQL
      const [doc] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, documentId), eq(documents.isArchived, false)))
        .limit(1);

      if (!doc) {
        return callback({ success: false, error: 'Document not found or archived' });
      }

      // 2. Check authorization: Is caller the owner or an active collaborator?
      let userRole = null;

      if (doc.ownerId === userId) {
        userRole = 'owner';
      } else {
        const [collab] = await db
          .select({ role: documentCollaborators.role })
          .from(documentCollaborators)
          .where(
            and(
              eq(documentCollaborators.documentId, documentId),
              eq(documentCollaborators.userId, userId)
            )
          )
          .limit(1);

        if (collab) {
          userRole = collab.role; // 'editor' | 'viewer'
        }
      }

      // 3. Reject if unauthorized
      if (!userRole) {
        console.warn(`[Socket Room] Unauthorized join attempt by ${socket.user.email} on doc ${documentId}`);
        return callback({
          success: false,
          error: 'You do not have permission to access this document room',
        });
      }

      // 4. Leave any previous document room this socket was in
      if (socket.currentDocumentId && socket.currentDocumentId !== documentId) {
        socket.leave(socket.currentDocumentId);
        socket.to(socket.currentDocumentId).emit('user-left', {
          user: socket.user,
          documentId: socket.currentDocumentId,
        });
      }

      // 5. Join the new isolated room
      socket.join(documentId);
      socket.currentDocumentId = documentId;
      socket.userRole = userRole;

      console.log(
        `[Socket Room] User "${socket.user.name}" joined room "${documentId}" with role "${userRole}"`
      );

      // 6. Notify other active users in the room
      socket.to(documentId).emit('user-joined', {
        user: socket.user,
        role: userRole,
        timestamp: new Date().toISOString(),
      });

      // 7. Acknowledge back to client with confirmation & role
      callback({
        success: true,
        documentId,
        userRole,
        user: socket.user,
      });
    } catch (error) {
      console.error('[Socket Room] Error joining document:', error);
      callback({ success: false, error: 'Failed to join document room' });
    }
  });

  /**
   * Handle incoming Quill Delta changes from an active editor
   * Broadcasts delta payload only to peer collaborators in the same room
   */
  socket.on('send-changes', ({ documentId, delta }) => {
    if (!documentId || !delta) return;

    // Security Check: Verify socket is currently inside this document room
    if (socket.currentDocumentId !== documentId) {
      console.warn(`[Socket Delta] Rejected delta: Socket ${socket.id} not in room ${documentId}`);
      return;
    }

    // Role Check: Viewers are strictly prohibited from broadcasting changes
    if (socket.userRole === 'viewer') {
      console.warn(`[Socket Delta] Rejected edit attempt from viewer ${socket.user.email} in room ${documentId}`);
      return;
    }

    // Broadcast delta to all other sockets in this room (excluding sender)
    socket.to(documentId).emit('receive-changes', {
      delta,
      senderId: socket.user.id,
      senderName: socket.user.name,
      timestamp: Date.now(),
    });
  });

  /**
   * Handle live document title renaming broadcast
   */
  socket.on('send-title-change', ({ documentId, title }) => {
    if (!documentId || !title) return;

    if (socket.currentDocumentId !== documentId || socket.userRole === 'viewer') {
      return;
    }

    // Broadcast updated title to all other peers in the room
    socket.to(documentId).emit('receive-title-change', {
      title,
      senderId: socket.user.id,
      senderName: socket.user.name,
    });
  });

  /**
   * Handle leaving a document room explicitly
   */
  socket.on('leave-document', ({ documentId }) => {
    if (!documentId) return;

    socket.leave(documentId);
    if (socket.currentDocumentId === documentId) {
      socket.currentDocumentId = null;
    }

    console.log(`[Socket Room] User "${socket.user.name}" left room "${documentId}"`);

    socket.to(documentId).emit('user-left', {
      user: socket.user,
      documentId,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Handle socket disconnection (browser closed, tab refreshed, network dropped)
   */
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('user-left', {
          user: socket.user,
          documentId: room,
          timestamp: new Date().toISOString(),
        });
      }
    }
    console.log(`[Socket] Client disconnected: ${socket.user?.name || socket.id}`);
  });
};