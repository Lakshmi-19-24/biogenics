import { Router } from 'express';

import {
  assignDocument,
  deleteDocument,
  listDocuments,
  replyToDocument,
  unassignDocument,
  updateDocument,
  uploadDocument
} from '../controllers/document.controller.js';

import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

export const documentRouter = Router();

documentRouter.use(authenticate);

// View documents
documentRouter.get('/', listDocuments);

// Upload document
documentRouter.post(
  '/',
  upload.single('file'),
  uploadDocument
);

// Assign document to a Sales Executive
documentRouter.post(
  '/:id/assign',
  assignDocument
);

// Remove assignment
documentRouter.post(
  '/:id/unassign',
  unassignDocument
);

// Review / Reply
documentRouter.post(
  '/:id/reply',
  replyToDocument
);

// Update / Delete
documentRouter
  .route('/:id')
  .patch(updateDocument)
  .delete(deleteDocument);