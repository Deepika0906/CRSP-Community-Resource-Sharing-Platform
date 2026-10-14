const express = require('express');
const router = express.Router();
const { createReview, getUserReviews, getResourceReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.get('/resource/:resourceId', getResourceReviews);

module.exports = router;
