import { Router } from 'express';
import {
  createDocument,
  getUserDocuments,
  getDocumentById,
  updateDocumentTitle,
  saveDocumentData,
  deleteDocument,
} from '../controllers/docController.js';
import {
  addCollaborator,
  getCollaborators,
  removeCollaborator,
} from '../controllers/collaboratorController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createDocumentSchema,
  documentIdParamSchema,
  updateDocumentTitleSchema,
  saveDocumentDataSchema,
  addCollaboratorSchema,
  collaboratorParamsSchema,
} from '../validators/docValidator.js';

const router = Router();

// Lock down all document routes to authenticated users
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

// Collaborator management routes
router
  .route('/:id/collaborators')
  .get(validate(documentIdParamSchema, 'params'), getCollaborators)
  .post(
    validate(documentIdParamSchema, 'params'),
    validate(addCollaboratorSchema),
    addCollaborator
  );

router.delete(
  '/:id/collaborators/:userId',
  validate(collaboratorParamsSchema, 'params'),
  removeCollaborator
);

export default router;