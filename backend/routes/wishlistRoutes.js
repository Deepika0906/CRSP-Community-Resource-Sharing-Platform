const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWishlist);
router.post('/', protect, addToWishlist);
router.delete('/:resourceId', protect, removeFromWishlist);

module.exports = router;
