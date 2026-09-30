import { z } from 'zod';

// Validates that route parameter :id is a valid UUID
export const documentIdParamSchema = z.object({
  id: z.string().uuid('Invalid document ID format. Must be a valid UUID.'),
});

// Validates document creation payload
export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .max(255, 'Document title cannot exceed 255 characters')
    .optional()
    .default('Untitled Document'),
});

// Validates document title rename payload
export const updateDocumentTitleSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Document title cannot be empty')
    .max(255, 'Document title cannot exceed 255 characters'),
});

// Validates editor delta persistence payload
export const saveDocumentDataSchema = z.object({
  data: z.record(z.any(), { required_error: 'Document content data is required' }),
});

export const addCollaboratorSchema = z.object({
  email: z
    .string({ required_error: 'Collaborator email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  role: z.enum(['viewer', 'editor'], {
    errorMap: () => ({ message: "Role must be either 'viewer' or 'editor'" }),
  }).default('editor'),
});

// Validates removing a collaborator (documentId param + userId param)
export const collaboratorParamsSchema = z.object({
  id: z.string().uuid('Invalid document ID format'),
  userId: z.coerce.number().int().positive('Invalid user ID'),
});