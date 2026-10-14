import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents, documentCollaborators } from '../db/schema.js';

// In-Memory Room Presence Registry: Map<documentId, Map<socketId, { userId, name, email, role, color }>>
const documentPresence = new Map();

// Deterministic signature color palette for collaborator avatars
const AVATAR_COLORS = [
  '#2563EB', // Blue
  '#7C3AED', // Violet
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#4F46E5', // Indigo
];

function assignUserColor(userId) {
  let hash = 0;
  const strId = String(userId);
  for (let i = 0; i < strId.length; i++) {
    hash = strId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getUniqueActiveUsers(documentId) {
  const roomSockets = documentPresence.get(documentId);
  if (!roomSockets) return [];

  const uniqueUsers = new Map();
  for (const info of roomSockets.values()) {
    if (!uniqueUsers.has(info.userId)) {
      uniqueUsers.set(info.userId, info);
    }
  }
  return Array.from(uniqueUsers.values());
}

/**
 * Verify whether a user is either the owner or an active collaborator of a document
 */
async function verifyUserDocumentAccess(userId, documentId) {
  // Check if owner
  const [ownedDoc] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.ownerId, userId), eq(documents.isArchived, false)))
    .limit(1);

  if (ownedDoc) return { hasAccess: true, role: 'owner' };

  // Check if collaborator
  const [collab] = await db
    .select({ id: documentCollaborators.id, role: documentCollaborators.role })
    .from(documentCollaborators)
    .where(and(eq(documentCollaborators.documentId, documentId), eq(documentCollaborators.userId, userId)))
    .limit(1);

  if (collab) return { hasAccess: true, role: collab.role };

  return { hasAccess: false, role: null };
}

export function registerDocumentHandlers(io, socket) {
  const user = socket.user;
  const userColor = assignUserColor(user.id);

  // 1. Join Document Room (with Permission Verification & Presence Registration)
  socket.on('join-document', async (payload, callback = () => {}) => {
    const documentId = typeof payload === 'string' ? payload : payload?.documentId;

    if (!documentId) {
      return callback({ success: false, error: 'Document ID is required' });
    }

    try {
      // Security Check: Verify user has permission to view this document
      const { hasAccess, role } = await verifyUserDocumentAccess(user.id, documentId);
      if (!hasAccess) {
        console.warn(`[Socket Security] Unauthorized join attempt by User ${user.id} on Doc ${documentId}`);
        return callback({ success: false, error: 'Forbidden: You do not have permission to access this document' });
      }

      // Track socket state
      socket.currentDocumentId = documentId;
      socket.userRole = role;

      // Join isolated Socket.IO room
      socket.join(documentId);

      // Register in memory presence
      if (!documentPresence.has(documentId)) {
        documentPresence.set(documentId, new Map());
      }
      const roomMap = documentPresence.get(documentId);
      roomMap.set(socket.id, {
        userId: user.id,
        name: user.name || 'Anonymous Collaborator',
        email: user.email,
        role,
        color: userColor,
      });

      const activeUsers = getUniqueActiveUsers(documentId);

      // Broadcast updated presence to everyone in the room
      io.to(documentId).emit('presence-update', { documentId, activeUsers });

      callback({ success: true, documentId, userRole: role, activeUsers, userColor });
    } catch (err) {
      console.error('[Socket] join-document error:', err);
      callback({ success: false, error: 'Internal server error joining document' });
    }
  });

  // 2. Broadcast Document Changes (Real-Time Delta Stream)
  socket.on('send-changes', ({ documentId, delta }) => {
    if (!documentId || !delta) return;
    if (socket.userRole === 'viewer') return; // Read-only guard
    socket.to(documentId).emit('receive-changes', { delta, senderId: user.id });
  });

  // 3. Broadcast Title Change
  socket.on('send-title-change', ({ documentId, title }) => {
    if (!documentId || !title) return;
    if (socket.userRole === 'viewer') return;
    socket.to(documentId).emit('receive-title-change', { title, senderId: user.id });
  });

  // 4. Save Document Data via WebSocket
  socket.on('save-document', async ({ documentId, data, content }, callback = () => {}) => {
    const docData = data || content;
    if (!documentId || !docData) {
      return callback({ success: false, error: 'Invalid payload' });
    }

    if (socket.userRole === 'viewer') {
      return callback({ success: false, error: 'Unauthorized: Read-only viewer' });
    }

    try {
      io.to(documentId).emit('save-status', { status: 'saving' });

      await db
        .update(documents)
        .set({
          data: docData,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId));

      io.to(documentId).emit('save-status', { status: 'saved' });

      callback({ success: true });
    } catch (error) {
      console.error('[Socket] Failed to persist document via WebSocket:', error);
      io.to(documentId).emit('save-status', { status: 'error' });
      callback({ success: false, error: 'Database persistence failed' });
    }
  });

  // 5. Clean up presence on disconnect / leave
  const handleLeaveAllRooms = () => {
    for (const [docId, roomMap] of documentPresence.entries()) {
      if (roomMap.has(socket.id)) {
        roomMap.delete(socket.id);

        if (roomMap.size === 0) {
          documentPresence.delete(docId);
        } else {
          const activeUsers = getUniqueActiveUsers(docId);
          io.to(docId).emit('presence-update', { documentId: docId, activeUsers });
        }
      }
    }
  };

  socket.on('leave-document', (payload) => {
    const documentId = typeof payload === 'string' ? payload : payload?.documentId;
    if (!documentId) return;
    socket.leave(documentId);

    const roomMap = documentPresence.get(documentId);
    if (roomMap && roomMap.has(socket.id)) {
      roomMap.delete(socket.id);
      if (roomMap.size === 0) {
        documentPresence.delete(documentId);
      } else {
        const activeUsers = getUniqueActiveUsers(documentId);
        io.to(documentId).emit('presence-update', { documentId, activeUsers });
      }
    }
  });

  socket.on('disconnecting', () => {
    handleLeaveAllRooms();
  });
}