const { Router } = require('express');

const rateLimit = require('express-rate-limit');
const { validate } = require('../middleware/validateRequest');
const { profileUpdateSchema, passwordChangeSchema } = require('../utils/joiSchemas'); 
const { updateProfile, changePassword } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/uploadProfile.middleware');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // VERY strict
  message: {
    message: 'Too many attempts. Please try again later.',
  },
});

// Change New Pasword
router.post('/account/change-password', protect,  changePassword);

// Operations
router.put('/update-profile', protect,  upload.single('image'), validate (profileUpdateSchema),updateProfile);



module.exports = router;