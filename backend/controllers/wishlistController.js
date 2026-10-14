const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/Wishlist');
const Resource = require('../models/Resource');

// @desc    Add a resource to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { resourceId } = req.body;
  if (!resourceId) {
    res.status(400);
    throw new Error('resourceId is required');
  }
  const resource = await Resource.findOne({ _id: resourceId, isDeleted: false });
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const existing = await Wishlist.findOne({ user: req.user._id, resource: resourceId });
  if (existing) {
    res.status(400);
    throw new Error('This resource is already in your wishlist');
  }

  const item = await Wishlist.create({ user: req.user._id, resource: resourceId });
  res.status(201).json({ success: true, data: item });
});

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:resourceId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const result = await Wishlist.findOneAndDelete({
    user: req.user._id,
    resource: req.params.resourceId,
  });
  if (!result) {
    res.status(404);
    throw new Error('Wishlist item not found');
  }
  res.json({ success: true, message: 'Removed from wishlist' });
});

// @desc    Get my wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id })
    .populate({
      path: 'resource',
      populate: { path: 'owner', select: 'name avatar' },
    })
    .sort({ createdAt: -1 });

  // Filter out entries whose resource was deleted
  const valid = items.filter((i) => i.resource && !i.resource.isDeleted);
  res.json({ success: true, data: valid });
});

module.exports = { addToWishlist, removeFromWishlist, getWishlist };
