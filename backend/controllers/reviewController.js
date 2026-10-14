const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const BorrowRequest = require('../models/BorrowRequest');
const GiveawayRequest = require('../models/GiveawayRequest');
const Resource = require('../models/Resource');

// @desc    Submit a review for a completed transaction
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { transactionType, transactionId, rating, comment } = req.body;

  if (!transactionType || !transactionId || !rating) {
    res.status(400);
    throw new Error('transactionType, transactionId and rating are required');
  }
  if (!['BORROW', 'GIVEAWAY'].includes(transactionType)) {
    res.status(400);
    throw new Error('transactionType must be BORROW or GIVEAWAY');
  }
  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  let transaction;
  let revieweeId;
  let resourceId;

  if (transactionType === 'BORROW') {
    transaction = await BorrowRequest.findById(transactionId);
    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }
    if (transaction.status !== 'RETURNED') {
      res.status(400);
      throw new Error('You can only review a borrow after the item has been returned');
    }
    if (String(transaction.requester) !== String(req.user._id)) {
      res.status(403);
      throw new Error('Only the borrower can leave this review');
    }
    revieweeId = transaction.owner;
    resourceId = transaction.resource;
  } else {
    transaction = await GiveawayRequest.findById(transactionId);
    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }
    if (transaction.status !== 'HANDED_OVER') {
      res.status(400);
      throw new Error('You can only review a giveaway after handover is complete');
    }
    if (String(transaction.requester) !== String(req.user._id)) {
      res.status(403);
      throw new Error('Only the recipient can leave this review');
    }
    revieweeId = transaction.owner;
    resourceId = transaction.resource;
  }

  const existing = await Review.findOne({
    transactionType,
    transactionId,
    reviewer: req.user._id,
  });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this transaction');
  }

  const review = await Review.create({
    resource: resourceId,
    reviewer: req.user._id,
    reviewee: revieweeId,
    rating,
    comment,
    transactionType,
    transactionId,
  });

  res.status(201).json({ success: true, data: review });
});

// @desc    Get reviews for a given user (as reviewee) with average rating
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate('reviewer', 'name avatar')
    .populate('resource', 'title')
    .sort({ createdAt: -1 });

  const avg = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  res.json({
    success: true,
    data: reviews,
    averageRating: Math.round(avg * 10) / 10,
    count: reviews.length,
  });
});

// @desc    Get reviews for a resource
// @route   GET /api/reviews/resource/:resourceId
// @access  Public
const getResourceReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ resource: req.params.resourceId })
    .populate('reviewer', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

module.exports = { createReview, getUserReviews, getResourceReviews };
