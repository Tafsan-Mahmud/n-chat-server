const Joi = require('joi');

exports.authSchema = Joi.object({
email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
  country: Joi.string().required(),
  // These fields are optional for registration
  active_Status: Joi.boolean().default(false).optional(),
  profile_image: Joi.string().uri().allow('').optional(),
  title: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional(),
});

exports.otpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

exports.profileUpdateSchema = Joi.object({
  name: Joi.string().min(2),
  profile_image: Joi.string().uri().allow(''),
  title: Joi.string().allow(''),
  bio: Joi.string().allow(''),
});