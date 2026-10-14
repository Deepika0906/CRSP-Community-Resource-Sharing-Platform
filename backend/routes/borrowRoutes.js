const express = require('express');
const router = express.Router();
const {
  createBorrowRequest,
  getBorrowRequests,
  acceptBorrowRequest,
  rejectBorrowRequest,
  cancelBorrowRequest,
  markCollected,
  confirmReturn,
} = require('../controllers/borrowController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBorrowRequest);
router.get('/', protect, getBorrowRequests);
router.put('/:id/accept', protect, acceptBorrowRequest);
router.put('/:id/reject', protect, rejectBorrowRequest);
router.put('/:id/cancel', protect, cancelBorrowRequest);
router.put('/:id/collect', protect, markCollected);
router.put('/:id/return', protect, confirmReturn);

module.exports = router;
