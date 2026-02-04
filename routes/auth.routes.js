const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { validate } = require('../middleware/validateRequest');
const { registerAuthSchema,   signinAuthSchema,  otpSchema,  profileUpdateSchema } = require('../utils/joiSchemas'); 
const { updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/uploadProfile.middleware');
const { verifyTokenOnly } = require('../middleware/tokenVerify.middleware');
const {  registerUser,  loginUser,   logoutUser,  verifyOtp, returnME,  validateToken, forgotPasswordInit, forgotPassword, validateResetToken, resetPassword } = require('../controllers/auth.controller'); 

const router = Router();



// token checking
router.get('/validate-token', verifyTokenOnly, validateToken);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // VERY strict
  message: {
    message: 'Too many attempts. Please try again later.',
  },
});
// Authentication
router.post('/register', authLimiter, validate(registerAuthSchema), registerUser);
router.post('/login', authLimiter, validate(signinAuthSchema), loginUser); 
router.post('/verify-otp', authLimiter, validate(otpSchema), verifyOtp);
router.post('/logout', logoutUser);

// Password forgot 
router.post('/forgot-password/init', authLimiter, forgotPasswordInit );
router.post('/forgot-password', authLimiter, forgotPassword );
router.post('/validate-reset-token', authLimiter, validateResetToken);
router.post('/reset-password', authLimiter, resetPassword );


// return login users safe data with secure token verification....
router.get('/me',protect, returnME);



module.exports = router;
