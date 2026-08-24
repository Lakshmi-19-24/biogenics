import { LocationPing } from '../models/locationPing.model.js';
import { User } from '../models/user.model.js';
import { Attendance } from '../models/attendance.model.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';

const businessDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

const isValidCoordinate = (latitude, longitude) =>
  Number.isFinite(Number(latitude)) &&
  Number.isFinite(Number(longitude)) &&
  Number(latitude) >= -90 &&
  Number(latitude) <= 90 &&
  Number(longitude) >= -180 &&
  Number(longitude) <= 180 &&
  !(Number(latitude) === 0 && Number(longitude) === 0);

const MAX_ACCURACY_METERS = 2000;

/**
 * Returns true when the user has an open attendance session for today
 * (checked in and not yet checked out).
 */
export const hasActiveCheckIn = async (userId) => {
  const attendance = await Attendance.findOne({
    employee: userId,
    date: businessDate(),
    checkInAt: { $ne: null },
    checkOutAt: null
  });
  return Boolean(attendance);
};

const visibleEmployeeRolesFor = (role) => {
  if (role === ROLES.OWNER || role === ROLES.MANAGER) {
    return null;
  }

  return [];
};
/**
 * Saves a location ping for the authenticated user.
 */
export const createLocationPing = asyncHandler(async (req, res) => {
  if (req.user.role === ROLES.SALES_EXECUTIVE && !(await hasActiveCheckIn(req.user._id))) {
    throw new ApiError(403, 'Location tracking is only active between check-in and check-out');
  }

  const accuracy = Number(req.body.accuracy);
  if (Number.isFinite(accuracy) && accuracy > MAX_ACCURACY_METERS) {
    throw new ApiError(422, 'Location accuracy too low to record');
  }

  const ping = await LocationPing.create({
    employee: req.user._id,
    source: req.body.source || 'manual',
    location: { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] },
    speed: req.body.speed,
    battery: req.body.battery,
    accuracy: req.body.accuracy,
    metadata: req.body.metadata,
    trackedAt: req.body.trackedAt || new Date()
  });

  sendResponse(res, 201, 'Location ping saved', ping);
});

/**
 * Lists location pings for route playback and audit.
 */
export const listLocationPings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.employee) filter.employee = req.query.employee;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.from || req.query.to) {
    filter.trackedAt = {};
    if (req.query.from) filter.trackedAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.trackedAt.$lte = new Date(req.query.to);
  }
  const visibleRoles = visibleEmployeeRolesFor(req.user.role);
  if (visibleRoles) {
    const visibleEmployeeIds = await User.find({ role: { $in: visibleRoles } }).distinct('_id');
    const canViewRequestedEmployee = visibleEmployeeIds.some((id) => String(id) === String(req.query.employee));
    filter.employee = req.query.employee
      ? canViewRequestedEmployee ? req.query.employee : { $in: [] }
      : { $in: visibleEmployeeIds };
  }

  const [items, total] = await Promise.all([
    LocationPing.find(filter).populate('employee', 'name email role').skip(skip).limit(limit).sort('-trackedAt'),
    LocationPing.countDocuments(filter)
  ]);

  sendResponse(res, 200, 'Location pings fetched', { items, page, limit, total });
});

/**
 * Returns the most recent location per employee.
 */
export const latestLocations = asyncHandler(async (req, res) => {
  const items = await LocationPing.aggregate([
    {
      $match: {
        'location.type': 'Point',
        'location.coordinates': {
          $elemMatch: { $type: 'number', $ne: 0 }
        },
        $or: [
          { accuracy: { $exists: false } },
          { accuracy: { $lte: MAX_ACCURACY_METERS } }
        ]
      }
    },
    {
      $addFields: {
        latitude: { $arrayElemAt: ['$location.coordinates', 1] },
        longitude: { $arrayElemAt: ['$location.coordinates', 0] }
      }
    },
    { $match: { latitude: { $gte: -90, $lte: 90 }, longitude: { $gte: -180, $lte: 180 } } },
    { $sort: { trackedAt: -1 } },
    { $group: { _id: '$employee', ping: { $first: '$$ROOT' } } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'employee'
      }
    },
    { $unwind: '$employee' },
    ...(visibleEmployeeRolesFor(req.user.role) ? [{ $match: { 'employee.role': { $in: visibleEmployeeRolesFor(req.user.role) } } }] : []),
    {
      $project: {
        _id: '$ping._id',
        source: '$ping.source',
        location: '$ping.location',
        speed: '$ping.speed',
        battery: '$ping.battery',
        accuracy: '$ping.accuracy',
        trackedAt: '$ping.trackedAt',
        employee: { _id: '$employee._id', name: '$employee.name', email: '$employee.email', role: '$employee.role' }
      }
    },
    { $sort: { trackedAt: -1 } }
  ]);

  sendResponse(res, 200, 'Latest locations fetched', items);
});
