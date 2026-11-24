import mongoose from 'mongoose';
import { ExcelSheet } from '../models/excelSheet.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';
import { uploadToImageKit } from '../utils/uploadToImagekit.js';
import { notifyUser } from '../services/notification.service.js';
import { ROLES } from '../constants/roles.js';

/*
 * ACCESS RULES
 *  - Owner + Manager : see every sheet and decide who gets access.
 *  - Everyone else (Sales, Billing/admin): see only sheets they uploaded,
 *    sheets assigned to them, or sheets the manager opened to everyone.
 *  - Every logged-in user can upload a sheet.
 */
const canGrantAccess = (user) => [ROLES.OWNER, ROLES.MANAGER].includes(user.role);

const accessFilter = (user) => {
  if (canGrantAccess(user)) return {};
  return {
    $or: [{ uploadedBy: user._id }, { accessAll: true }, { assignedTo: user._id }]
  };
};

const populateSheet = (query) =>
  query
    .populate('uploadedBy', 'name email role')
    .populate('assignedTo', 'name email role');

const parseIdList = (value) => {
  if (value === undefined || value === null || value === '') return [];
  let list = value;
  if (typeof value === 'string') {
    try {
      list = JSON.parse(value);
    } catch {
      list = value.split(',');
    }
  }
  if (!Array.isArray(list)) list = [list];
  const ids = [...new Set(list.map((id) => String(id).trim()).filter(Boolean))];
  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw new ApiError(400, 'Invalid user selected');
  }
  return ids;
};

const toBool = (value) => value === true || value === 'true' || value === '1';

const validateRecipients = async (ids) => {
  if (ids.length === 0) return;
  const count = await User.countDocuments({
    _id: { $in: ids },
    isActive: true,
    role: { $in: [ROLES.SALES_EXECUTIVE, ROLES.ADMIN, ROLES.MANAGER] }
  });
  if (count !== ids.length) {
    throw new ApiError(400, 'Selected users must be active Sales, Billing or Manager users');
  }
};

const notifyRecipients = async (sheet, ids, actor) => {
  await Promise.all(
    ids
      .filter((id) => String(id) !== String(actor._id))
      .map((id) =>
        notifyUser({
          recipient: id,
          title: 'Excel sheet assigned',
          message: `${actor.name} gave you access to Excel sheet ${sheet.sheetId} - ${sheet.title}.`,
          type: 'system',
          data: { action: 'excel_sheet_assigned', sheetId: sheet.sheetId }
        }).catch(() => null)
      )
  );
};

/** Users the manager can give access to (Sales + Billing + Managers). */
export const listRecipients = asyncHandler(async (req, res) => {
  if (!canGrantAccess(req.user)) {
    throw new ApiError(403, 'Only Owner or Manager can give access to Excel sheets');
  }
  const users = await User.find({
    isActive: true,
    _id: { $ne: req.user._id },
    role: { $in: [ROLES.SALES_EXECUTIVE, ROLES.ADMIN, ROLES.MANAGER] }
  })
    .select('name email role')
    .sort('name');

  sendResponse(res, 200, 'Recipients fetched', { items: users });
});

export const listExcelSheets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = accessFilter(req.user);

  const [items, total] = await Promise.all([
    populateSheet(ExcelSheet.find(filter)).sort('-createdAt').skip(skip).limit(limit),
    ExcelSheet.countDocuments(filter)
  ]);

  sendResponse(res, 200, 'Excel sheets fetched', { items, page, limit, total });
});

export const uploadExcelSheet = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Excel file is required');

  const title = String(req.body.title || '').trim() || req.file.originalname;

  let accessAll = false;
  let assignedTo = [];

  const wantsAccess = req.body.accessAll !== undefined || req.body.assignedTo !== undefined;
  if (wantsAccess) {
    if (!canGrantAccess(req.user)) {
      throw new ApiError(403, 'Only Owner or Manager can give access to Excel sheets');
    }
    accessAll = toBool(req.body.accessAll);
    assignedTo = parseIdList(req.body.assignedTo);
    await validateRecipients(assignedTo);
  }

  const _id = new mongoose.Types.ObjectId();
  const sheetId = `XL-${String(_id).slice(-6).toUpperCase()}`;

  const file = await uploadToImageKit(req.file, '/biogenics/excel-sheets');

  const sheet = await ExcelSheet.create({
    _id,
    sheetId,
    title,
    notes: String(req.body.notes || '').trim(),
    file,
    uploadedBy: req.user._id,
    accessAll,
    assignedTo
  });

  await notifyRecipients(sheet, assignedTo, req.user);

  const populated = await populateSheet(ExcelSheet.findById(sheet._id));
  sendResponse(res, 201, 'Excel sheet uploaded', populated);
});

export const updateExcelAccess = asyncHandler(async (req, res) => {
  if (!canGrantAccess(req.user)) {
    throw new ApiError(403, 'Only Owner or Manager can give access to Excel sheets');
  }

  const sheet = await ExcelSheet.findById(req.params.id);
  if (!sheet) throw new ApiError(404, 'Excel sheet not found');

  const assignedTo = parseIdList(req.body.assignedTo);
  await validateRecipients(assignedTo);

  const previous = new Set(sheet.assignedTo.map(String));
  sheet.accessAll = toBool(req.body.accessAll);
  sheet.assignedTo = assignedTo;
  await sheet.save();

  await notifyRecipients(
    sheet,
    assignedTo.filter((id) => !previous.has(String(id))),
    req.user
  );

  const populated = await populateSheet(ExcelSheet.findById(sheet._id));
  sendResponse(res, 200, 'Access updated', populated);
});

export const deleteExcelSheet = asyncHandler(async (req, res) => {
  const sheet = await ExcelSheet.findOne({ _id: req.params.id, ...accessFilter(req.user) });
  if (!sheet) throw new ApiError(404, 'Excel sheet not found');

  const isUploader = String(sheet.uploadedBy) === String(req.user._id);
  if (!canGrantAccess(req.user) && !isUploader) {
    throw new ApiError(403, 'You cannot delete this sheet');
  }

  await ExcelSheet.deleteOne({ _id: sheet._id });
  sendResponse(res, 200, 'Excel sheet deleted', { id: req.params.id });
});
