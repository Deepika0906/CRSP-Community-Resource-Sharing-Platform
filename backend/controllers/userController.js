const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = address;

  if (req.file) {
    user.avatar = `/uploads/${req.file.filename}`;
  }

  await user.save();
  res.json({ success: true, data: user.toSafeObject() });
});

// @desc    Change password (while logged in)
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current and new password are required');
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});

// @desc    Get a public-safe view of another user (for resource owner info)
// @route   GET /api/users/:id
// @access  Private
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name avatar createdAt');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
});

// ---- Admin ----

// @desc    List all users
// @route   GET /api/users
// @access  Private/Admin
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

// @desc    Suspend/reactivate a user
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const setUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    res.status(400);
    throw new Error('Status must be "active" or "suspended"');
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (String(user._id) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot change your own status');
  }
  user.status = status;
  await user.save();
  res.json({ success: true, data: user.toSafeObject() });
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (String(user._id) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

module.exports = {
  updateProfile,
  changePassword,
  getPublicProfile,
  listUsers,
  setUserStatus,
  deleteUser,
};
