const { Router } = require('express');

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


// Authentication
router.post('/register', validate(registerAuthSchema), registerUser);
router.post('/login', validate(signinAuthSchema), loginUser); 
router.post('/verify-otp', validate(otpSchema), verifyOtp);
router.post('/logout', logoutUser);

// Password forgot 
router.post('/forgot-password/init', forgotPasswordInit );
router.post('/forgot-password', forgotPassword );
router.post('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword );

// return login users safe data with secure token verification....

router.get('/me',protect, returnME);



module.exports = router;
