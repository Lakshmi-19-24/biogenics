import mongoose from 'mongoose';

const excelSheetSchema = new mongoose.Schema(
  {
    // Human readable ID shown to users, e.g. XL-3F9A2C
    sheetId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: '' },

    file: {
      url: { type: String, required: true },
      fileId: { type: String, required: true },
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
