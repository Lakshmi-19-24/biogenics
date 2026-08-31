import { Document } from '../models/document.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';
import { uploadToImageKit } from '../utils/uploadToImagekit.js';
import {
  ADMIN_ROLES,
  MANAGEMENT_ROLES,
  ROLES
} from '../constants/roles.js';

const MAX_DOCUMENTS = 2000;

/*
 * =========================================================
 * DOCUMENT ACCESS
 * =========================================================
 *
 * FULL ACCESS:
 * - Owner
 * - Admin
 * - Manager
 *
 * LIMITED ACCESS:
 * - Sales Executive
 *
 * Sales Executive can see:
 * 1. Documents uploaded by themselves
 * 2. Documents specifically assigned to themselves
 *
 * Management can see ALL documents.
 */
const documentAccessFilter = (user) => {
  /*
   * Owner + Admin + Manager
   * can see every document.
   *
   * This means:
   * Vijay   -> owner   -> ALL
   * Vinutha -> manager -> ALL
   * Chandru -> manager -> ALL
   * Billing -> admin   -> ALL
   */
  if (MANAGEMENT_ROLES.includes(user.role)) {
    return {};
  }

  /*
   * Sales Executive:
   *
   * Own uploaded documents
   * OR
   * documents assigned specifically to them.
   */
  return {
    $or: [
      {
        uploadedBy: user._id
      },
      {
        visibility: 'private',
        assignedTo: user._id
      }
    ]
  };
};

/*
 * =========================================================
 * DOCUMENT MANAGEMENT PERMISSION
 * =========================================================
 *
 * Owner, Admin and Manager can manage documents.
 */
const canManageDocument = (document, user) =>
  MANAGEMENT_ROLES.includes(user.role) ||
  String(document.uploadedBy) === String(user._id);

/*
 * =========================================================
 * DOCUMENT ASSIGNMENT PERMISSION
 * =========================================================
 *
 * Owner, Admin and Manager can assign documents.
 *
 * Sales Executives cannot assign documents.
 */
const canAssignDocument = (user) =>
  MANAGEMENT_ROLES.includes(user.role);

/*
 * =========================================================
 * VALIDATE DOCUMENT RECIPIENT
 * =========================================================
 *
 * A document can currently be assigned to:
 *
 * - Manager
 * - Sales Executive
 *
 * Billing is currently represented by the existing
 * "admin" role in this project, so Billing already has
 * management-level document access.
 */
const validateAssignment = async (assignedTo) => {
  if (!assignedTo) {
    return null;
  }

  const user = await User.findOne({
    _id: assignedTo,
    isActive: true,
    role: {
      $in: [
        ROLES.MANAGER,
        ROLES.SALES_EXECUTIVE
      ]
    }
  }).select(
    '_id name email role'
  );

  if (!user) {
    throw new ApiError(
      400,
      'Selected recipient must be an active Manager or Sales Executive'
    );
  }

  return user;
};

/*
 * =========================================================
 * UPLOAD DOCUMENT
 * =========================================================
 *
 * All authenticated users can upload documents.
 *
 * Team document:
 * - No specific recipient.
 *
 * Private document:
 * - Owner/Admin/Manager must select recipient.
 */
export const uploadDocument = asyncHandler(
  async (req, res) => {
    if (!req.file) {
      throw new ApiError(
        400,
        'Document file is required'
      );
    }

    const totalDocuments =
      await Document.countDocuments();

    if (totalDocuments >= MAX_DOCUMENTS) {
      throw new ApiError(
        400,
        'Maximum limit of 2,000 documents has been reached'
      );
    }

    const visibility =
      req.body.visibility || 'team';

    if (
      !['team', 'private'].includes(
        visibility
      )
    ) {
      throw new ApiError(
        400,
        'Invalid document visibility'
      );
    }

    let assignedTo = null;

    /*
     * =====================================================
     * TEAM DOCUMENT
     * =====================================================
     *
     * No specific recipient.
     */
    if (visibility === 'team') {
      assignedTo = null;
    }

    /*
     * =====================================================
     * PRIVATE DOCUMENT
     * =====================================================
     *
     * Management must assign the recipient.
     */
    if (visibility === 'private') {
      if (!canAssignDocument(req.user)) {
        throw new ApiError(
          403,
          'Only Owner, Admin or Manager can assign a private document'
        );
      }

      if (!req.body.assignedTo) {
        throw new ApiError(
          400,
          'Please select the person who should receive this document'
        );
      }

      await validateAssignment(
        req.body.assignedTo
      );

      assignedTo =
        req.body.assignedTo;
    }

    /*
     * =====================================================
     * UPLOAD TO IMAGEKIT
     * =====================================================
     */
    const file =
      await uploadToImageKit(
        req.file,
        '/biogenics/documents'
      );

    /*
     * =====================================================
     * CREATE DOCUMENT
     * =====================================================
     */
    const document =
      await Document.create({
        title: req.body.title,

        category:
          req.body.category ||
          'other',

        customer:
          req.body.customer ||
          undefined,

        order:
          req.body.order ||
          undefined,

        visibility,

        assignedTo,

        file,

        uploadedBy:
          req.user._id,

        replies: []
      });

    /*
     * =====================================================
     * POPULATE RESPONSE
     * =====================================================
     */
    const populated =
      await Document.findById(
        document._id
      )
        .populate(
          'uploadedBy',
          'name email role'
        )
        .populate(
          'assignedTo',
          'name email role'
        )
        .populate(
          'replies.user',
          'name email role'
        );

    sendResponse(
      res,
      201,
      'Document uploaded',
      populated
    );
  }
);

/*
 * =========================================================
 * LIST DOCUMENTS
 * =========================================================
 *
 * Returns only documents the logged-in user is allowed
 * to see.
 */
export const listDocuments =
  asyncHandler(
    async (req, res) => {
      const {
        page,
        limit,
        skip
      } = getPagination(
        req.query
      );

      /*
       * Start with permission filter.
       */
      const filter =
        documentAccessFilter(
          req.user
        );

      /*
       * Customer filter.
       */
      if (req.query.customer) {
        filter.customer =
          req.query.customer;
      }

      /*
       * Order filter.
       */
      if (req.query.order) {
        filter.order =
          req.query.order;
      }

      /*
       * Category filter.
       */
      if (req.query.category) {
        filter.category =
          req.query.category;
      }

      /*
       * Assigned recipient filter.
       *
       * Only management can filter
       * all documents by recipient.
       */
      if (req.query.assignedTo) {
        if (
          !canAssignDocument(
            req.user
          )
        ) {
          throw new ApiError(
            403,
            'Only Owner, Admin or Manager can filter by recipient'
          );
        }

        filter.assignedTo =
          req.query.assignedTo;
      }

      /*
       * Fetch documents + total count.
       */
      const [
        items,
        total
      ] = await Promise.all([
        Document.find(filter)
          .populate(
            'uploadedBy',
            'name email role'
          )
          .populate(
            'assignedTo',
            'name email role'
          )
          .populate(
            'replies.user',
            'name email role'
          )
          .skip(skip)
          .limit(limit)
          .sort('-createdAt'),

        Document.countDocuments(
          filter
        )
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
          maxDocuments:
            MAX_DOCUMENTS
        }
      );
    }
  );

/*
 * =========================================================
 * ASSIGN DOCUMENT
 * =========================================================
 *
 * Owner/Admin/Manager can assign an existing document.
 */
export const assignDocument =
  asyncHandler(
    async (req, res) => {
      if (
        !canAssignDocument(
          req.user
        )
      ) {
        throw new ApiError(
          403,
          'Only Owner, Admin or Manager can assign documents'
        );
      }

      const {
        assignedTo
      } = req.body;

      if (!assignedTo) {
        throw new ApiError(
          400,
          'Recipient is required'
        );
      }

      /*
       * Verify recipient exists,
       * is active and has an allowed role.
       */
      await validateAssignment(
        assignedTo
      );

      /*
       * Change document to private
       * and assign recipient.
       */
      const document =
        await Document.findByIdAndUpdate(
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
          .populate(
            'uploadedBy',
            'name email role'
          )
          .populate(
            'assignedTo',
            'name email role'
          )
          .populate(
            'replies.user',
            'name email role'
          );

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
    }
  );

/*
 * =========================================================
 * UNASSIGN DOCUMENT
 * =========================================================
 *
 * Changes a private document back to Team visibility.
 */
export const unassignDocument =
  asyncHandler(
    async (req, res) => {
      if (
        !canAssignDocument(
          req.user
        )
      ) {
        throw new ApiError(
          403,
          'Only Owner, Admin or Manager can change document assignment'
        );
      }

      const document =
        await Document.findByIdAndUpdate(
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
          .populate(
            'uploadedBy',
            'name email role'
          )
          .populate(
            'assignedTo',
            'name email role'
          )
          .populate(
            'replies.user',
            'name email role'
          );

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
    }
  );

/*
 * =========================================================
 * REPLY TO DOCUMENT
 * =========================================================
 */
export const replyToDocument =
  asyncHandler(
    async (req, res) => {
      const message =
        String(
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

      /*
       * Only users who can see the
       * document can reply.
       */
      const document =
        await Document.findOne({
          _id: req.params.id,
          ...documentAccessFilter(
            req.user
          )
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

      const populated =
        await Document.findById(
          document._id
        )
          .populate(
            'uploadedBy',
            'name email role'
          )
          .populate(
            'assignedTo',
            'name email role'
          )
          .populate(
            'replies.user',
            'name email role'
          );

      sendResponse(
        res,
        201,
        'Reply added successfully',
        populated
      );
    }
  );

/*
 * =========================================================
 * UPDATE DOCUMENT
 * =========================================================
 */
export const updateDocument =
  asyncHandler(
    async (req, res) => {
      /*
       * First check whether user can see it.
       */
      const existing =
        await Document.findOne({
          _id: req.params.id,
          ...documentAccessFilter(
            req.user
          )
        });

      if (!existing) {
        throw new ApiError(
          404,
          'Document not found'
        );
      }

      /*
       * Then check whether user can
       * actually modify it.
       */
      if (
        !canManageDocument(
          existing,
          req.user
        )
      ) {
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
        if (
          req.body[key] !==
          undefined
        ) {
          payload[key] =
            req.body[key] ||
            undefined;
        }
      }

      const document =
        await Document.findByIdAndUpdate(
          req.params.id,
          payload,
          {
            new: true,
            runValidators: true
          }
        )
          .populate(
            'uploadedBy',
            'name email role'
          )
          .populate(
            'assignedTo',
            'name email role'
          )
          .populate(
            'replies.user',
            'name email role'
          );

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
    }
  );

/*
 * =========================================================
 * DELETE DOCUMENT
 * =========================================================
 */
export const deleteDocument =
  asyncHandler(
    async (req, res) => {
      const document =
        await Document.findOne({
          _id: req.params.id,
          ...documentAccessFilter(
            req.user
          )
        });

      if (!document) {
        throw new ApiError(
          404,
          'Document not found'
        );
      }

      if (
        !canManageDocument(
          document,
          req.user
        )
      ) {
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
    }
  );