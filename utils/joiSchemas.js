const Joi = require('joi');

exports.authSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  active_Status: Joi.boolean().default(false),
  profile_image: Joi.string().allow(''),
  title: Joi.string().allow(''),
  bio: Joi.string().allow(''),
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