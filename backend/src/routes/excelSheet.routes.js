import { Router } from 'express';
import {
  deleteExcelSheet,
  listExcelSheets,
  listRecipients,
  updateExcelAccess,
  uploadExcelSheet
} from '../controllers/excelSheet.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { excelUpload } from '../middlewares/upload.js';

export const excelSheetRouter = Router();

excelSheetRouter.use(authenticate);

excelSheetRouter.get('/', listExcelSheets);
excelSheetRouter.get('/recipients', listRecipients);
excelSheetRouter.post('/', excelUpload.single('file'), uploadExcelSheet);
excelSheetRouter.patch('/:id/access', updateExcelAccess);
excelSheetRouter.delete('/:id', deleteExcelSheet);
