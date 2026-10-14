const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Resource = require('../models/Resource');
const BorrowRequest = require('../models/BorrowRequest');
const GiveawayRequest = require('../models/GiveawayRequest');

// A conversation only exists between a resource's owner and someone who has
// an actual (non-cancelled/rejected) request on that resource. This check
// prevents strangers from opening chats on arbitrary listings.
const canParticipate = async (resourceId, userId) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) return false;
  if (String(resource.owner) === String(userId)) return true;

  const activeBorrow = await BorrowRequest.findOne({
    resource: resourceId,
    requester: userId,
    status: { $ne: 'CANCELLED' },
  });
  if (activeBorrow) return true;

  const activeGiveaway = await GiveawayRequest.findOne({
    resource: resourceId,
    requester: userId,
    status: { $nin: ['CANCELLED', 'REJECTED', 'AUTO_REJECTED'] },
  });
  return !!activeGiveaway;
};

// @desc    Send a message about a resource to another participant
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { resourceId, recipientId, text } = req.body;
  if (!resourceId || !recipientId || !text || !text.trim()) {
    res.status(400);
    throw new Error('resourceId, recipientId and text are required');
  }

  const senderOk = await canParticipate(resourceId, req.user._id);
  if (!senderOk) {
    res.status(403);
    throw new Error('You do not have an active request on this resource, so you cannot message about it');
  }

  const message = await Message.create({
    resource: resourceId,
    participants: [req.user._id, recipientId].sort(),
    sender: req.user._id,
    text: text.trim(),
  });

  res.status(201).json({ success: true, data: message });
});

// @desc    Get message history for a resource conversation with a specific user
// @route   GET /api/messages/:resourceId/:otherUserId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const { resourceId, otherUserId } = req.params;

  const ok = await canParticipate(resourceId, req.user._id);
  if (!ok) {
    res.status(403);
    throw new Error('You do not have access to this conversation');
  }

  const participants = [req.user._id.toString(), otherUserId].sort();

  const messages = await Message.find({
    resource: resourceId,
    participants: { $all: participants, $size: 2 },
  })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 });

  res.json({ success: true, data: messages });
});

// @desc    List distinct conversations for the logged-in user
// @route   GET /api/messages
// @access  Private
const listConversations = asyncHandler(async (req, res) => {
  const messages = await Message.find({ participants: req.user._id })
    .populate('resource', 'title images')
    .populate('sender', 'name avatar')
    .populate('participants', 'name avatar')
    .sort({ createdAt: -1 });

  // Collapse into unique (resource, otherParticipant) threads, most recent first
  const seen = new Set();
  const threads = [];
  for (const m of messages) {
    const other = m.participants.find((p) => String(p._id) !== String(req.user._id));
    if (!other) continue;
    const key = `${m.resource?._id}-${other._id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    threads.push({
      resource: m.resource,
      otherUser: other,
      lastMessage: m.text,
      lastMessageAt: m.createdAt,
    });
  }

  res.json({ success: true, data: threads });
});

module.exports = { sendMessage, getConversation, listConversations };
