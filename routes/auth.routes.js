const express = require('express');
const { registerUser, loginUser, logoutUser, verifyOtp, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validateRequest');
const { authSchema, otpSchema, profileUpdateSchema, signinAuthSchema } = require('../utils/joiSchemas');
const { upload, uploadImageToCloudinary } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/register', validate(authSchema), registerUser);
router.post('/signin', validate(signinAuthSchema), loginUser);
router.post('/verify-otp', validate(otpSchema), verifyOtp);
router.post('/logout', logoutUser);

router.put('/profile', protect, upload.single('profile_image'), uploadImageToCloudinary, validate(profileUpdateSchema), updateProfile);

module.exports = router;