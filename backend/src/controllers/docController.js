
import { eq, and, desc, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents, documentCollaborators } from '../db/schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

// Helper: resolve user role on a document ('owner' | 'editor' | 'viewer' | null)
const getUserRole = async (documentId, userId, ownerId) => {
  if (ownerId === userId) return 'owner';

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

  return collab ? collab.role : null;
};

/**
 * @desc    Create a new blank document
 * @route   POST /api/v1/documents
 * @access  Private (Protected)
 */
export const createDocument = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const userId = req.user.id;

  const [newDoc] = await db
    .insert(documents)
    .values({
      title: title || 'Untitled Document',
      ownerId: userId,
      data: { ops: [{ insert: '\n' }] },
    })
    .returning();

  res.status(201).json({
    success: true,
    message: 'Document created successfully',
    data: {
      document: newDoc,
      userRole: 'owner',
    },
  });
});

/**
 * @desc    Get all active documents owned by or shared with the user
 * @route   GET /api/v1/documents
 * @access  Private (Protected)
 */
export const getUserDocuments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 1. Fetch owned documents
  const ownedDocs = await db
    .select({
      id: documents.id,
      title: documents.title,
      ownerId: documents.ownerId,
      isArchived: documents.isArchived,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(and(eq(documents.ownerId, userId), eq(documents.isArchived, false)))
    .orderBy(desc(documents.updatedAt));

  // 2. Fetch shared collaborations
  const collaborations = await db
    .select({
      documentId: documentCollaborators.documentId,
      role: documentCollaborators.role,
    })
    .from(documentCollaborators)
    .where(eq(documentCollaborators.userId, userId));

  let sharedDocs = [];
  if (collaborations.length > 0) {
    const docIds = collaborations.map((c) => c.documentId);
    const rawShared = await db
      .select({
        id: documents.id,
        title: documents.title,
        ownerId: documents.ownerId,
        isArchived: documents.isArchived,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(and(inArray(documents.id, docIds), eq(documents.isArchived, false)))
      .orderBy(desc(documents.updatedAt));

    // Map role onto shared documents
    const roleMap = new Map(collaborations.map((c) => [c.documentId, c.role]));
    sharedDocs = rawShared.map((doc) => ({
      ...doc,
      userRole: roleMap.get(doc.id) || 'viewer',
    }));
  }

  // Tag owned documents with role 'owner'
  const taggedOwned = ownedDocs.map((doc) => ({ ...doc, userRole: 'owner' }));

  res.status(200).json({
    success: true,
    count: taggedOwned.length + sharedDocs.length,
    data: {
      owned: taggedOwned,
      shared: sharedDocs,
    },
  });
});

/**
 * @desc    Get single document by ID (includes rich text delta data + role)
 * @route   GET /api/v1/documents/:id
 * @access  Private (Protected)
 */
export const getDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.isArchived, false)))
    .limit(1);

  if (!doc) {
    throw new AppError('Document not found', 404);
  }

  // Check role
  const userRole = await getUserRole(doc.id, userId, doc.ownerId);

  if (!userRole) {
    throw new AppError('You do not have permission to view this document', 403);
  }

  res.status(200).json({
    success: true,
    data: {
      document: doc,
      userRole,
    },
  });
});

/**
 * @desc    Update document title
 * @route   PATCH /api/v1/documents/:id
 * @access  Private (Owner or Editor only)
 */
export const updateDocumentTitle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const userId = req.user.id;

  const [existingDoc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.isArchived, false)))
    .limit(1);

  if (!existingDoc) {
    throw new AppError('Document not found', 404);
  }

  const userRole = await getUserRole(existingDoc.id, userId, existingDoc.ownerId);

  if (!userRole || userRole === 'viewer') {
    throw new AppError('You do not have permission to rename this document', 403);
  }

  const [updatedDoc] = await db
    .update(documents)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning();

  res.status(200).json({
    success: true,
    message: 'Document title updated successfully',
    data: {
      document: updatedDoc,
    },
  });
});

/**
 * @desc    Save/Persist editor delta content
 * @route   PUT /api/v1/documents/:id/save
 * @access  Private (Owner or Editor only)
 */
export const saveDocumentData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;
  const userId = req.user.id;

  const [existingDoc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.isArchived, false)))
    .limit(1);

  if (!existingDoc) {
    throw new AppError('Document not found', 404);
  }

  const userRole = await getUserRole(existingDoc.id, userId, existingDoc.ownerId);

  if (!userRole || userRole === 'viewer') {
    throw new AppError('Viewers do not have permission to edit this document', 403);
  }

  const [savedDoc] = await db
    .update(documents)
    .set({
      data,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning();

  res.status(200).json({
    success: true,
    message: 'Document content saved successfully',
    data: {
      document: savedDoc,
    },
  });
});

/**
 * @desc    Delete document (owner only)
 * @route   DELETE /api/v1/documents/:id
 * @access  Private (Protected - Owner only)
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const [existingDoc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.isArchived, false)))
    .limit(1);

  if (!existingDoc) {
    throw new AppError('Document not found', 404);
  }

  if (existingDoc.ownerId !== userId) {
    throw new AppError('Only the document owner can delete this document', 403);
  }

  await db.delete(documents).where(eq(documents.id, id));

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully',
  });
});