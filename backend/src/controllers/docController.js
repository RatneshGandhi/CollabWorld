import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents } from '../db/schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Create a new blank document
 * @route   POST /api/v1/documents
 * @access  Private (Protected)
 */

export const createDocument = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const userId = req.user.id;

  // Insert document with default title and empty Quill delta
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

  // Select only metadata for high performance dashboard loading (exclude heavy 'data' column)
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