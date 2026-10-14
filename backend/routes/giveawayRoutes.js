const express = require('express');
const router = express.Router();
const {
  createGiveawayRequest,
  getGiveawayRequests,
  acceptGiveawayRequest,
  rejectGiveawayRequest,
  cancelGiveawayRequest,
  confirmHandover,
  confirmReceipt,
} = require('../controllers/giveawayController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createGiveawayRequest);
router.get('/', protect, getGiveawayRequests);
router.put('/:id/accept', protect, acceptGiveawayRequest);
router.put('/:id/reject', protect, rejectGiveawayRequest);
router.put('/:id/cancel', protect, cancelGiveawayRequest);
router.put('/:id/confirm-handover', protect, confirmHandover);
router.put('/:id/confirm-receipt', protect, confirmReceipt);

module.exports = router;
