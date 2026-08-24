import { Document } from '../models/document.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';
import { uploadToImageKit } from '../utils/uploadToImagekit.js';
import { ADMIN_ROLES, ROLES } from '../constants/roles.js';

const MAX_DOCUMENTS = 2000;

/*
 * Owner/Admin can see everything.
 *
 * Everyone else:
 * - team documents are visible to everyone
 * - private documents are visible only to the assigned user
 * - a user can always see documents they uploaded themselves
 */
const documentAccessFilter = (user) => {
  if (ADMIN_ROLES.includes(user.role)) {
    return {};
  }

  return {
    $or: [
      { visibility: 'team' },
      { visibility: 'private', assignedTo: user._id },
      { uploadedBy: user._id }
    ]
  };
};

const canManageDocument = (document, user) =>
  ADMIN_ROLES.includes(user.role) ||
  String(document.uploadedBy) === String(user._id);

const canAssignDocument = (user) =>
  ADMIN_ROLES.includes(user.role);

/*
 * Validate that the selected recipient is an active user.
 *
 * We allow:
 * - Vinutha (manager)
 * - Chandru (manager)
 * - Shilpa (sales)
 * - Chandan (sales)
 *
 * More active users can also be selected later if needed.
 */
const validateAssignment = async (assignedTo) => {
  if (!assignedTo) return null;

  const user = await User.findOne({
    _id: assignedTo,
    isActive: true,
    role: {
      $in: [
        ROLES.MANAGER,
        ROLES.SALES_EXECUTIVE
      ]
    }
  }).select('_id name email role');

  if (!user) {
    throw new ApiError(
      400,
      'Selected recipient must be an active Manager or Sales Executive'
    );
  }

  return user;
};

/*
 * Upload document.
 *
 * All authenticated members can upload.
 * Owner/Admin can assign it to a specific Manager/Sales user.
 */
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Document file is required');
  }

  const totalDocuments = await Document.countDocuments();

  if (totalDocuments >= MAX_DOCUMENTS) {
    throw new ApiError(
      400,
      'Maximum limit of 2,000 documents has been reached'
    );
  }

  const visibility = req.body.visibility || 'team';

  if (!['team', 'private'].includes(visibility)) {
    throw new ApiError(
      400,
      'Invalid document visibility'
    );
  }

  let assignedTo = null;

  /*
   * Team document:
   * no specific recipient required.
   */
  if (visibility === 'team') {
    assignedTo = null;
  }

  /*
   * Private document:
   * Owner/Admin must provide the recipient.
   */
  if (visibility === 'private') {
    if (!canAssignDocument(req.user)) {
      throw new ApiError(
        403,
        'Only Owner or Admin can assign a private document'
      );
    }

    if (!req.body.assignedTo) {
      throw new ApiError(
        400,
        'Please select the person who should receive this document'
      );
    }

    await validateAssignment(req.body.assignedTo);

    assignedTo = req.body.assignedTo;
  }

  const file = await uploadToImageKit(
    req.file,
    '/biogenics/documents'
  );

  const document = await Document.create({
    title: req.body.title,
    category: req.body.category || 'other',
    customer: req.body.customer || undefined,
    order: req.body.order || undefined,
    visibility,
    assignedTo,
    file,
    uploadedBy: req.user._id,
    replies: []
  });

  const populated = await Document.findById(document._id)
    .populate('uploadedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('replies.user', 'name email role');

  sendResponse(
    res,
    201,
    'Document uploaded',
    populated
  );
});

/*
 * List documents according to access permissions.
 */
export const listDocuments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = documentAccessFilter(req.user);

  if (req.query.customer) {
    filter.customer = req.query.customer;
  }

  if (req.query.order) {
    filter.order = req.query.order;
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.assignedTo) {
    if (!canAssignDocument(req.user)) {
      throw new ApiError(
        403,
        'Only Owner or Admin can filter by recipient'
      );
    }

    filter.assignedTo = req.query.assignedTo;
  }

  const [items, total] = await Promise.all([
    Document.find(filter)
      .populate('uploadedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('replies.user', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt'),

    Document.countDocuments(filter)
  ]);

  sendResponse(
    res,
    200,
    'Documents fetched',
    {
      items,
      page,
      limit,
      total,
      maxDocuments: MAX_DOCUMENTS
    }
  );
});

/*
 * Assign an existing document.
 *
 * Owner/Admin only.
 */
export const assignDocument = asyncHandler(async (req, res) => {
  if (!canAssignDocument(req.user)) {
    throw new ApiError(
      403,
      'Only Owner or Admin can assign documents'
    );
  }

  const { assignedTo } = req.body;

  if (!assignedTo) {
    throw new ApiError(
      400,
      'Recipient is required'
    );
  }

  await validateAssignment(assignedTo);

  const document = await Document.findByIdAndUpdate(
    req.params.id,
    {
      visibility: 'private',
      assignedTo
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate('uploadedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('replies.user', 'name email role');

  if (!document) {
    throw new ApiError(
      404,
      'Document not found'
    );
  }

  sendResponse(
    res,
    200,
    'Document assigned successfully',
    document
  );
});

/*
 * Make a private document a Team document.
 */
export const unassignDocument = asyncHandler(async (req, res) => {
  if (!canAssignDocument(req.user)) {
    throw new ApiError(
      403,
      'Only Owner or Admin can change document assignment'
    );
  }

  const document = await Document.findByIdAndUpdate(
    req.params.id,
    {
      visibility: 'team',
      assignedTo: null
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate('uploadedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('replies.user', 'name email role');

  if (!document) {
    throw new ApiError(
      404,
      'Document not found'
    );
  }

  sendResponse(
    res,
    200,
    'Document changed to Team visibility',
    document
  );
});

/*
 * Review / Reply.
 */
export const replyToDocument = asyncHandler(async (req, res) => {
  const message = String(
    req.body.message || ''
  ).trim();

  if (!message) {
    throw new ApiError(
      400,
      'Reply message is required'
    );
  }

  if (message.length > 5000) {
    throw new ApiError(
      422,
      'Reply cannot exceed 5,000 characters'
    );
  }

  const document = await Document.findOne({
    _id: req.params.id,
    ...documentAccessFilter(req.user)
  });

  if (!document) {
    throw new ApiError(
      404,
      'Document not found'
    );
  }

  document.replies.push({
    user: req.user._id,
    message
  });

  await document.save();

  const populated = await Document.findById(
    document._id
  )
    .populate('uploadedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('replies.user', 'name email role');

  sendResponse(
    res,
    201,
    'Reply added successfully',
    populated
  );
});

/*
 * Update document metadata.
 */
export const updateDocument = asyncHandler(async (req, res) => {
  const existing = await Document.findOne({
    _id: req.params.id,
    ...documentAccessFilter(req.user)
  });

  if (!existing) {
    throw new ApiError(
      404,
      'Document not found'
    );
  }

  if (!canManageDocument(existing, req.user)) {
    throw new ApiError(
      403,
      'You cannot update this document'
    );
  }

  const allowed = [
    'title',
    'category',
    'customer',
    'order'
  ];

  const payload = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      payload[key] =
        req.body[key] || undefined;
    }
  }

  const document = await Document.findByIdAndUpdate(
    req.params.id,
    payload,
    {
      new: true,
      runValidators: true
    }
  )
    .populate('uploadedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('replies.user', 'name email role');

  if (!document) {
    throw new ApiError(
      404,
      'Document not found'
    );
  }

  sendResponse(
    res,
    200,
    'Document updated',
    document
  );
});

/*
 * Delete document.
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    ...documentAccessFilter(req.user)
  });

  if (!document) {
    throw new ApiError(
      404,
      'Document not found'
    );
  }

  if (!canManageDocument(document, req.user)) {
    throw new ApiError(
      403,
      'You cannot delete this document'
    );
  }

  await Document.deleteOne({
    _id: document._id
  });

  sendResponse(
    res,
    200,
    'Document deleted',
    {
      id: req.params.id
    }
  );
});