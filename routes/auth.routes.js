const { Router } = require('express');

// Note: Imports now use named imports from the controller file
const {  registerUser,  loginUser,   logoutUser,  verifyOtp,  updateProfile,  validateToken } = require('../controllers/auth.controller'); 
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validateRequest');
const { registerAuthSchema,   signinAuthSchema,  otpSchema,  profileUpdateSchema } = require('../utils/joiSchemas'); 

const { upload,  uploadImageToCloudinary } = require('../middleware/upload.middleware');

const { verifyTokenOnly } = require('../middleware/tokenVerify.middleware');

const router = Router();

// token checking
router.get('/validate-token', verifyTokenOnly, validateToken);

// Authentication
router.post('/register', validate(registerAuthSchema), registerUser);
router.post('/login', validate(signinAuthSchema), loginUser); 
router.post('/verify-otp', validate(otpSchema), verifyOtp);
router.post('/logout', logoutUser);

// Operations
router.put('/profile', protect,  upload.single('profile_image'),  uploadImageToCloudinary,  validate (profileUpdateSchema),  updateProfile);

module.exports = router;
