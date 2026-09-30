import { Router } from 'express';
import {
  createDocument,
  getUserDocuments,
  getDocumentById,
  updateDocumentTitle,
  saveDocumentData,
  deleteDocument,
} from '../controllers/docController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createDocumentSchema,
  documentIdParamSchema,
  updateDocumentTitleSchema,
  saveDocumentDataSchema,
} from '../validators/docValidator.js';

const router = Router();

// Protect all document routes
router.use(protect);

// Collection routes
router
  .route('/')
  .post(validate(createDocumentSchema), createDocument)
  .get(getUserDocuments);

// Single document routes
router
  .route('/:id')
  .get(validate(documentIdParamSchema, 'params'), getDocumentById)
  .patch(
    validate(documentIdParamSchema, 'params'),
    validate(updateDocumentTitleSchema),
    updateDocumentTitle
  )
  .delete(validate(documentIdParamSchema, 'params'), deleteDocument);

// Editor delta save route
router.put(
  '/:id/save',
  validate(documentIdParamSchema, 'params'),
  validate(saveDocumentDataSchema),
  saveDocumentData
);

export default router;