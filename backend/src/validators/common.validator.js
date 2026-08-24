import Joi from 'joi';

export const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  geoFenceVerified: Joi.boolean()
});

export const locationPingSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  speed: Joi.number().min(0),
  battery: Joi.number().min(0).max(100),
  accuracy: Joi.number().min(0),
  source: Joi.string().valid('socket', 'attendance', 'visit', 'manual'),
  trackedAt: Joi.date(),
  metadata: Joi.object(),
  geoFenceVerified: Joi.boolean()
});
