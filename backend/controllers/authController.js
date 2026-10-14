const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, phone, address } = req.body;

  if (!name || !email || !password || !confirmPassword || !phone || !address) {
    res.status(400);
    throw new Error('All fields are required: name, email, password, confirmPassword, phone, address');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Password and confirm password do not match');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, phone, address });

  res.status(201).json({
    success: true,
    data: {
      user: user.toSafeObject(),
      token: generateToken(user._id),
    },
  });
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.status === 'suspended') {
    res.status(403);
    throw new Error('Your account has been suspended. Contact an administrator.');
  }

  res.json({
    success: true,
    data: {
      user: user.toSafeObject(),
      token: generateToken(user._id),
    },
  });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toSafeObject() });
});

// @desc    Request password reset (development-safe: returns token directly
//          instead of pretending an email was sent, since no email service
//          is configured for this student project)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Do not reveal whether the email exists, to avoid user enumeration.
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account with that email exists, a reset token has been generated.',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save({ validateBeforeSave: false });

  // NOTE: No email service is configured in this project. In a real
  // deployment you would email `resetToken` to the user instead of
  // returning it in the API response. For local development/demo purposes
  // only, we return it directly so the flow is fully testable end-to-end.
  res.json({
    success: true,
    message: 'Reset token generated. (No email service configured — dev mode returns the token directly.)',
    devResetToken: resetToken,
    devNote: 'This field only appears because email sending is not configured. Never expose this in a real production deployment.',
  });
});

// @desc    Reset password using a valid token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) {
    res.status(400);
    throw new Error('Password and confirm password are required');
  }
  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    res.status(400);
    throw new Error('Reset token is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password has been reset. You can now log in with your new password.',
    data: { token: generateToken(user._id) },
  });
});

module.exports = { registerUser, loginUser, getMe, forgotPassword, resetPassword };
