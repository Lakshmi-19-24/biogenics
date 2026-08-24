import { Server } from 'socket.io';
import { env } from './env.js';
import { verifyAccessToken } from '../utils/token.js';
import { LocationPing } from '../models/locationPing.model.js';
import { User } from '../models/user.model.js';
import { ROLES } from '../constants/roles.js';
import { hasActiveCheckIn } from '../controllers/location.controller.js';

let io;

const MAX_ACCURACY_METERS = 2000;

const isValidCoordinate = (latitude, longitude) =>
  Number.isFinite(Number(latitude)) &&
  Number.isFinite(Number(longitude)) &&
  Number(latitude) >= -90 &&
  Number(latitude) <= 90 &&
  Number(longitude) >= -180 &&
  Number(longitude) <= 180 &&
  !(Number(latitude) === 0 && Number(longitude) === 0);

const isAcceptableAccuracy = (accuracy) => {
  const value = Number(accuracy);
  if (!Number.isFinite(value)) return true;
  return value <= MAX_ACCURACY_METERS;
};

/**
 * Initializes Socket.IO and attaches auth-aware room membership.
 *
 * @param {import('node:http').Server} server
 * @returns {Server}
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Socket auth token is required'));

      socket.user = verifyAccessToken(token);
      return next();
    } catch (_error) {
      return next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);

    socket.on('sales:location:update', async (payload, ack) => {
      const fail = (message) => {
        if (typeof ack === 'function') ack({ success: false, message });
      };

      try {
        if (socket.user.role !== ROLES.SALES_EXECUTIVE) {
          return fail('Only sales representatives can report location');
        }

        const latitude = Number(payload?.latitude);
        const longitude = Number(payload?.longitude);
        if (!isValidCoordinate(latitude, longitude)) {
          return fail('Invalid location coordinates');
        }

        if (!isAcceptableAccuracy(payload?.accuracy)) {
          return fail('Location accuracy too low to record');
        }

        if (!(await hasActiveCheckIn(socket.user.id))) {
          return fail('Location tracking is only active between check-in and check-out');
        }

        const trackedAt = new Date();
        const eventPayload = {
          user: socket.user.id,
          ...payload,
          latitude,
          longitude,
          trackedAt: trackedAt.toISOString()
        };

        await LocationPing.create({
          employee: socket.user.id,
          source: 'socket',
          location: { type: 'Point', coordinates: [longitude, latitude] },
          speed: payload.speed,
          battery: payload.battery,
          accuracy: payload.accuracy,
          metadata: payload.metadata,
          trackedAt
        });

        const employee = await User.findById(socket.user.id).select('_id name email role');
        if (employee) eventPayload.employee = { _id: employee._id, name: employee.name, email: employee.email, role: employee.role };

        socket.to('role:owner').to('role:manager').emit(
  'sales:location:updated',
  eventPayload
);
        if (typeof ack === 'function') ack({ success: true, trackedAt: eventPayload.trackedAt });
      } catch (error) {
        fail(error.message);
      }
    });
  });

  return io;
};

/**
 * Returns the live Socket.IO instance.
 *
 * @returns {Server | undefined}
 */
export const getIO = () => io;
