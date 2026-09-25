import { Router } from 'express';
import { createDocument, getUserDocuments } from '../controllers/docController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createDocumentSchema } from '../validators/docValidator.js';

const router = Router();

// Lock down all document routes to authenticated users
router.use(protect);

router.route('/')
  .post(validate(createDocumentSchema), createDocument)
  .get(getUserDocuments);

export default router;