import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .max(255, 'Document title cannot exceed 255 characters')
    .optional()
    .default('Untitled Document'),
});