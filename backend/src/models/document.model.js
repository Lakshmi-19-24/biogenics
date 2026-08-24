import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      enum: [
        'purchase_order',
        'quotation',
        'invoice',
        'agreement',
        'customer_document',
        'other'
      ],
      default: 'other',
      index: true
    },

    file: {
      url: {
        type: String,
        required: true
      },
      fileId: {
        type: String,
        required: true
      },
      name: String,
      size: Number,
      mimeType: String
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Specific Sales Executive assigned by Owner/Admin
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
visibility: {
  type: String,
  enum: ['team', 'private'],
  default: 'team'
},

    // Review / Reply messages
    replies: [replySchema]
  },
  {
    timestamps: true
  }
);

export const Document =
  mongoose.models.Document || mongoose.model('Document', documentSchema);