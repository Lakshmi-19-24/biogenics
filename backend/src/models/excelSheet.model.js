import mongoose from 'mongoose';

const excelSheetSchema = new mongoose.Schema(
  {
    // Human readable ID shown to users, e.g. XL-3F9A2C
    sheetId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: '' },

    // "file" = uploaded Excel/CSV, "google" = Google Sheet / Doc link
    type: { type: String, enum: ['file', 'google'], default: 'file' },
    link: { type: String, trim: true, default: '' },

    file: {
      url: String,
      fileId: String,
      name: String,
      size: Number,
      mimeType: String
    },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Access granted by Owner / Manager
    accessAll: { type: Boolean, default: false }, // everyone (sales + billing)
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }]
  },
  { timestamps: true }
);

export const ExcelSheet =
  mongoose.models.ExcelSheet || mongoose.model('ExcelSheet', excelSheetSchema);
