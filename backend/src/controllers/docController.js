import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents } from '../db/schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

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
    },
  });
});

/**
 * @desc    Get all active documents owned by the logged-in user
 * @route   GET /api/v1/documents
 * @access  Private (Protected)
 */
export const getUserDocuments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const userDocs = await db
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

  res.status(200).json({
    success: true,
    count: userDocs.length,
    data: {
      documents: userDocs,
    },
  });
});

/**
 * @desc    Get single document by ID (includes rich text delta data)
 * @route   GET /api/v1/documents/:id
 * @access  Private (Protected)
 */
export const getDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // 1. Query document by ID
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.isArchived, false)))
    .limit(1);

  // 2. Check if document exists
  if (!doc) {
    throw new AppError('Document not found', 404);
  }

  // 3. Authorization check: only owner can access (collaborators will be added in Phase 3)
  if (doc.ownerId !== userId) {
    throw new AppError('You do not have permission to view this document', 403);
  }

  res.status(200).json({
    success: true,
    data: {
      document: doc,
    },
  });
});

/**
 * @desc    Update document title
 * @route   PATCH /api/v1/documents/:id
 * @access  Private (Protected)
 */
export const updateDocumentTitle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const userId = req.user.id;

  // 1. Verify existence & ownership
  const [existingDoc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.isArchived, false)))
    .limit(1);

  if (!existingDoc) {
    throw new AppError('Document not found', 404);
  }

  if (existingDoc.ownerId !== userId) {
    throw new AppError('You do not have permission to rename this document', 403);
  }

  // 2. Update title & timestamp
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
 * @access  Private (Protected)
 */
export const saveDocumentData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;
  const userId = req.user.id;

  // 1. Verify existence & ownership
  const [existingDoc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.isArchived, false)))
    .limit(1);

  if (!existingDoc) {
    throw new AppError('Document not found', 404);
  }

  if (existingDoc.ownerId !== userId) {
    throw new AppError('You do not have permission to edit this document', 403);
  }

  // 2. Persist delta & update timestamp
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

  // 1. Verify existence & ownership
  const [existingDoc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (!existingDoc) {
    throw new AppError('Document not found', 404);
  }

  if (existingDoc.ownerId !== userId) {
    throw new AppError('Only the document owner can delete this document', 403);
  }

  // 2. Delete document from database
  await db.delete(documents).where(eq(documents.id, id));

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully',
  });
});