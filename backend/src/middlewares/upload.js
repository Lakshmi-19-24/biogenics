import multer from 'multer';
import { ApiError } from '../utils/apiError.js';

const storage = multer.memoryStorage();

/**
 * Multer middleware for ImageKit uploads.
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Unsupported file type'));
    }

    return cb(null, true);
  }
});

const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.csv'];
const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'text/csv',
  'application/csv',
  'application/octet-stream' // some browsers send this for .xlsx; extension is checked too
];

/**
 * Multer middleware for Excel / CSV sheet uploads only.
 */
export const excelUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    const extensionOk = EXCEL_EXTENSIONS.some((ext) => name.endsWith(ext));

    if (!extensionOk || !EXCEL_MIME_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Only Excel files (.xlsx, .xls, .xlsm) or .csv are allowed'));
    }
    return cb(null, true);
  }
});
