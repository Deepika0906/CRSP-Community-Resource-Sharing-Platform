const asyncHandler = require('express-async-handler');
const Resource = require('../models/Resource');
const BorrowRequest = require('../models/BorrowRequest');
const GiveawayRequest = require('../models/GiveawayRequest');
const User = require('../models/User');
const Report = require('../models/Report');
const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');

// @desc    Get logged-in user's dashboard summary
// @route   GET /api/dashboard
// @access  Private
const getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    myResources,
    activeBorrowings,
    pendingBorrowRequestsSent,
    incomingBorrowRequests,
    myGiveawayListings,
    givenAway,
    received,
    incomingGiveawayRequests,
    pendingGiveawayRequestsSent,
    wishlistCount,
    recentNotifications,
    unreadNotifications,
  ] = await Promise.all([
    Resource.find({ owner: userId, isDeleted: false }).sort({ createdAt: -1 }),
    BorrowRequest.find({ requester: userId, status: { $in: ['ACCEPTED', 'COLLECTED'] } }).populate('resource'),
    BorrowRequest.find({ requester: userId, status: 'PENDING' }).populate('resource'),
    BorrowRequest.find({ owner: userId, status: 'PENDING' }).populate('resource').populate('requester', 'name avatar'),
    Resource.find({ owner: userId, sharingMode: 'GIVEAWAY', isDeleted: false }),
    GiveawayRequest.find({ owner: userId, status: 'HANDED_OVER' }).populate('resource'),
    GiveawayRequest.find({ requester: userId, status: 'HANDED_OVER' }).populate('resource'),
    GiveawayRequest.find({ owner: userId, status: 'PENDING' }).populate('resource').populate('requester', 'name avatar'),
    GiveawayRequest.find({ requester: userId, status: 'PENDING' }).populate('resource'),
    Wishlist.countDocuments({ user: userId }),
    Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(5),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  res.json({
    success: true,
    data: {
      profile: req.user.toSafeObject(),
      myResources,
      activeBorrowings,
      pendingBorrowRequestsSent,
      incomingBorrowRequests,
      myGiveawayListings,
      givenAway,
      received,
      incomingGiveawayRequests,
      pendingGiveawayRequestsSent,
      recentNotifications,
      stats: {
        totalMyResources: myResources.length,
        totalActiveBorrowings: activeBorrowings.length,
        totalGivenAway: givenAway.length,
        totalReceived: received.length,
        totalPendingSent: pendingBorrowRequestsSent.length + pendingGiveawayRequestsSent.length,
        totalIncoming: incomingBorrowRequests.length + incomingGiveawayRequests.length,
        wishlistCount,
        unreadNotifications,
      },
    },
  });
});

// @desc    Admin platform statistics
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalResources,
    availableResources,
    activeBorrowings,
    completedGiveaways,
    pendingReports,
  ] = await Promise.all([
    User.countDocuments(),
    Resource.countDocuments({ isDeleted: false }),
    Resource.countDocuments({ isDeleted: false, status: 'AVAILABLE' }),
    BorrowRequest.countDocuments({ status: { $in: ['ACCEPTED', 'COLLECTED'] } }),
    GiveawayRequest.countDocuments({ status: 'HANDED_OVER' }),
    Report.countDocuments({ status: 'PENDING' }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalResources,
      availableResources,
      activeBorrowings,
      completedGiveaways,
      pendingReports,
    },
  });
});

module.exports = { getUserDashboard, getAdminDashboard };
