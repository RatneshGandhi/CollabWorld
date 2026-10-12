import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents, documentCollaborators } from '../db/schema.js';

// In-Memory Presence Registry: Map<documentId, Map<socketId, userInfo>>
const documentPresence = new Map();

// Color palette for collaborator avatar circles (Google Docs inspired)
const AVATAR_COLORS = [
  { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-300', hex: '#4f46e5' },
  { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-300', hex: '#059669' },
  { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-300', hex: '#d97706' },
  { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-300', hex: '#e11d48' },
  { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-300', hex: '#9333ea' },
  { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-300', hex: '#0891b2' },
  { bg: 'bg-pink-600', text: 'text-white', border: 'border-pink-300', hex: '#db2777' },
  { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-300', hex: '#0d9488' },
];

/**
 * Deterministically assign an avatar color based on user ID
 */
const getAvatarColor = (userId) => {
  const numId = typeof userId === 'number' ? userId : String(userId).charCodeAt(0) || 0;
  const index = Math.abs(numId) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * Get deduplicated list of active human users in a document room
 */
const getActiveUsersInRoom = (documentId) => {
  const roomMap = documentPresence.get(documentId);
  if (!roomMap) return [];

  // Deduplicate by userId (so multiple tabs by the same user only show 1 avatar)
  const userMap = new Map();
  for (const info of roomMap.values()) {
    if (!userMap.has(info.userId)) {
      userMap.set(info.userId, info);
    }
  }
  return Array.from(userMap.values());
};

/**
 * Helper to remove a socket from a room's presence map and broadcast update
 */
const removeSocketFromPresence = (io, socket, documentId) => {
  const roomMap = documentPresence.get(documentId);
  if (roomMap && roomMap.has(socket.id)) {
    roomMap.delete(socket.id);

    // Clean up empty room map to prevent memory leaks
    if (roomMap.size === 0) {
      documentPresence.delete(documentId);
    }

    const updatedUsers = getActiveUsersInRoom(documentId);

    // Broadcast updated presence to remaining users in the room
    io.to(documentId).emit('presence-update', {
      documentId,
      activeUsers: updatedUsers,
    });

    console.log(
      `[Presence] User "${socket.user?.name}" left doc "${documentId}". Active users remaining: ${updatedUsers.length}`
    );
  }
};

/**
 * Register document-specific WebSocket event listeners
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export const registerDocumentHandlers = (io, socket) => {
  /**
   * Handle joining an isolated document room
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

      // 2. Check authorization: Owner or Collaborator?
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
        removeSocketFromPresence(io, socket, socket.currentDocumentId);
      }

      // 5. Join the new isolated room
      socket.join(documentId);
      socket.currentDocumentId = documentId;
      socket.userRole = userRole;

      // 6. Record user in Presence Registry
      if (!documentPresence.has(documentId)) {
        documentPresence.set(documentId, new Map());
      }

      const userInfo = {
        userId: socket.user.id,
        name: socket.user.name,
        email: socket.user.email,
        role: userRole,
        color: getAvatarColor(socket.user.id),
        joinedAt: Date.now(),
      };

      documentPresence.get(documentId).set(socket.id, userInfo);

      const activeUsers = getActiveUsersInRoom(documentId);

      console.log(
        `[Presence] User "${socket.user.name}" joined doc "${documentId}". Active users now: ${activeUsers.length}`
      );

      // 7. Broadcast updated active users list to the ENTIRE room
      io.to(documentId).emit('presence-update', {
        documentId,
        activeUsers,
      });

      // 8. Return confirmation and current active users list to joining socket
      callback({
        success: true,
        documentId,
        userRole,
        activeUsers,
        user: socket.user,
      });
    } catch (error) {
      console.error('[Socket Room] Error joining document:', error);
      callback({ success: false, error: 'Failed to join document room' });
    }
  });

  /**
   * Handle incoming Quill Delta changes from an active editor
   */
  socket.on('send-changes', ({ documentId, delta }) => {
    if (!documentId || !delta) return;

    if (socket.currentDocumentId !== documentId || socket.userRole === 'viewer') {
      return;
    }

    socket.to(documentId).emit('receive-changes', {
      delta,
      senderId: socket.user.id,
      senderName: socket.user.name,
      timestamp: Date.now(),
    });
  });

  /**
   * Handle WebSocket-driven debounced document auto-save
   */
  socket.on('save-document', async ({ documentId, data }, callback = () => {}) => {
    try {
      if (!documentId || !data) {
        return callback({ success: false, error: 'Document ID and data are required' });
      }

      if (socket.currentDocumentId !== documentId || socket.userRole === 'viewer') {
        return callback({ success: false, error: 'Unauthorized to save' });
      }

      io.to(documentId).emit('save-status', {
        status: 'saving',
        userId: socket.user.id,
        userName: socket.user.name,
      });

      await db
        .update(documents)
        .set({
          data,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId));

      const lastSavedAt = new Date().toISOString();

      callback({ success: true, lastSavedAt });

      io.to(documentId).emit('save-status', {
        status: 'saved',
        lastSavedAt,
        userId: socket.user.id,
        userName: socket.user.name,
      });

      console.log(`[Socket Save] Persisted doc "${documentId}" to PostgreSQL by ${socket.user.name}`);
    } catch (error) {
      console.error('[Socket Save] Failed to persist document data:', error);
      callback({ success: false, error: 'Database persistence failed' });

      io.to(documentId).emit('save-status', {
        status: 'error',
        error: 'Failed to persist document to cloud',
      });
    }
  });

  /**
   * Handle live document title renaming broadcast
   */
  socket.on('send-title-change', ({ documentId, title }) => {
    if (!documentId || !title) return;

    if (socket.currentDocumentId !== documentId || socket.userRole === 'viewer') {
      return;
    }

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
    removeSocketFromPresence(io, socket, documentId);

    if (socket.currentDocumentId === documentId) {
      socket.currentDocumentId = null;
    }
  });

  /**
   * Handle socket disconnection
   */
  socket.on('disconnecting', () => {
    if (socket.currentDocumentId) {
      removeSocketFromPresence(io, socket, socket.currentDocumentId);
    }
    console.log(`[Socket] Client disconnected: ${socket.user?.name || socket.id}`);
  });
};