import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents, users, documentCollaborators } from '../db/schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

/**
 * @desc    Add / Invite a collaborator to a document by email
 * @route   POST /api/v1/documents/:id/collaborators
 * @access  Private (Owner only)
 */
export const addCollaborator = asyncHandler(async (req, res) => {
  const { id: documentId } = req.params;
  const { email, role } = req.body;
  const currentUserId = req.user.id;

  // 1. Verify document exists and caller is the owner
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.isArchived, false)))
    .limit(1);

  if (!doc) {
    throw new AppError('Document not found', 404);
  }

  if (doc.ownerId !== currentUserId) {
    throw new AppError('Only the document owner can invite collaborators', 403);
  }

  // 2. Find the user to invite by email
  const [userToInvite] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!userToInvite) {
    throw new AppError('No user found with this email address', 404);
  }

  // 3. Prevent owner from inviting themselves
  if (userToInvite.id === currentUserId) {
    throw new AppError('You are already the owner of this document', 400);
  }

  // 4. Check if user is already a collaborator
  const [existingCollaborator] = await db
    .select()
    .from(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, userToInvite.id)
      )
    )
    .limit(1);

  if (existingCollaborator) {
    // If already added, update their role
    const [updatedCollab] = await db
      .update(documentCollaborators)
      .set({ role })
      .where(eq(documentCollaborators.id, existingCollaborator.id))
      .returning();

    return res.status(200).json({
      success: true,
      message: `Collaborator role updated to ${role}`,
      data: {
        collaborator: {
          id: updatedCollab.id,
          userId: userToInvite.id,
          name: userToInvite.name,
          email: userToInvite.email,
          role: updatedCollab.role,
        },
      },
    });
  }

  // 5. Insert new collaborator
  const [newCollab] = await db
    .insert(documentCollaborators)
    .values({
      documentId,
      userId: userToInvite.id,
      role: role || 'editor',
    })
    .returning();

  res.status(201).json({
    success: true,
    message: 'Collaborator added successfully',
    data: {
      collaborator: {
        id: newCollab.id,
        userId: userToInvite.id,
        name: userToInvite.name,
        email: userToInvite.email,
        role: newCollab.role,
      },
    },
  });
});

/**
 * @desc    Get all collaborators for a document
 * @route   GET /api/v1/documents/:id/collaborators
 * @access  Private (Owner or Collaborators)
 */
export const getCollaborators = asyncHandler(async (req, res) => {
  const { id: documentId } = req.params;
  const currentUserId = req.user.id;

  // 1. Verify document exists
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.isArchived, false)))
    .limit(1);

  if (!doc) {
    throw new AppError('Document not found', 404);
  }

  // 2. Fetch owner details
  const [owner] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, doc.ownerId))
    .limit(1);

  // 3. Fetch all collaborators joined with user details
  const collabs = await db
    .select({
      id: documentCollaborators.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: documentCollaborators.role,
      createdAt: documentCollaborators.createdAt,
    })
    .from(documentCollaborators)
    .innerJoin(users, eq(documentCollaborators.userId, users.id))
    .where(eq(documentCollaborators.documentId, documentId));

  // 4. Verify caller is either the owner OR one of the collaborators
  const isAuthorized =
    doc.ownerId === currentUserId ||
    collabs.some((c) => c.userId === currentUserId);

  if (!isAuthorized) {
    throw new AppError('You do not have permission to view collaborators for this document', 403);
  }

  res.status(200).json({
    success: true,
    data: {
      owner: {
        ...owner,
        role: 'owner',
      },
      collaborators: collabs,
    },
  });
});

/**
 * @desc    Remove a collaborator from a document
 * @route   DELETE /api/v1/documents/:id/collaborators/:userId
 * @access  Private (Owner only, or self-removal)
 */
export const removeCollaborator = asyncHandler(async (req, res) => {
  const { id: documentId, userId: targetUserId } = req.params;
  const currentUserId = req.user.id;

  // 1. Verify document exists
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.isArchived, false)))
    .limit(1);

  if (!doc) {
    throw new AppError('Document not found', 404);
  }

  // 2. Authorization: only document owner OR the collaborator themselves can remove
  const isOwner = doc.ownerId === currentUserId;
  const isSelf = Number(targetUserId) === currentUserId;

  if (!isOwner && !isSelf) {
    throw new AppError('You do not have permission to remove this collaborator', 403);
  }

  // 3. Delete from junction table
  const deleted = await db
    .delete(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, Number(targetUserId))
      )
    )
    .returning();

  if (deleted.length === 0) {
    throw new AppError('Collaborator not found on this document', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Collaborator removed successfully',
  });
});