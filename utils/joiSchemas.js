const Joi = require('joi');

// Renamed for clarity: Handles user registration (includes name, country, optional fields)
exports.registerAuthSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
  country: Joi.string().required(),
  gender: Joi.string().required(),
  // These fields are optional for registration
  active_Status: Joi.boolean().default(false).optional(),
  profile_image: Joi.string().uri().allow('').optional(),
  title: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional(),
});

// Adopted: Handles user login (only email and password)
exports.signinAuthSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});


exports.otpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

exports.profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  profile_image: Joi.string().uri().allow('').optional(),
  avatarUrl: Joi.string().uri().optional(),
  title: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional(),
  country: Joi.string().optional(), // Re-added country to allow updates
  // CRITICAL SECURITY ADDITION: The middleware requires 'userId' for comparison.
  userId: Joi.string().optional(), 
});

exports.passwordSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(), // Consistent minimum length
});

exports.searchSchema = Joi.object({
    name: Joi.string().min(1).required(),
});
