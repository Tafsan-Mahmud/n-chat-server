const { Router } = require('express');

const { validate } = require('../middleware/validateRequest');
const { profileUpdateSchema } = require('../utils/joiSchemas'); 
const { updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/uploadProfile.middleware');

const router = Router();

// Operations
router.put('/update-profile', protect,  upload.single('image'), validate (profileUpdateSchema),updateProfile);


module.exports = router;