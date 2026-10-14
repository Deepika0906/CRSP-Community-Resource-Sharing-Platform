const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, listConversations } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, listConversations);
router.post('/', protect, sendMessage);
router.get('/:resourceId/:otherUserId', protect, getConversation);

module.exports = router;
