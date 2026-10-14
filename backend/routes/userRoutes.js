const express = require('express');
const router = express.Router();
const {
  updateProfile,
  changePassword,
  getPublicProfile,
  listUsers,
  setUserStatus,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);

router.get('/', protect, authorize('admin'), listUsers);
router.put('/:id/status', protect, authorize('admin'), setUserStatus);
router.delete('/:id', protect, authorize('admin'), deleteUser);

router.get('/:id', protect, getPublicProfile);

module.exports = router;
