const asyncHandler = require('express-async-handler');
const Resource = require('../models/Resource');
const GiveawayRequest = require('../models/GiveawayRequest');
const notify = require('../utils/notify');

// @desc    Request (claim) a GIVEAWAY resource
// @route   POST /api/giveaway-requests
// @access  Private
const createGiveawayRequest = asyncHandler(async (req, res) => {
  const { resourceId, message } = req.body;
  if (!resourceId) {
    res.status(400);
    throw new Error('resourceId is required');
  }

  const resource = await Resource.findOne({ _id: resourceId, isDeleted: false });
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  if (resource.sharingMode !== 'GIVEAWAY') {
    res.status(400);
    throw new Error('This resource is not a free giveaway item');
  }
  if (String(resource.owner) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot request your own resource');
  }
  if (resource.status !== 'AVAILABLE') {
    res.status(400);
    throw new Error('This item is no longer available (it may already be claimed)');
  }

  const existingActive = await GiveawayRequest.findOne({
    resource: resourceId,
    requester: req.user._id,
    status: { $in: ['PENDING', 'ACCEPTED'] },
  });
  if (existingActive) {
    res.status(400);
    throw new Error('You already have an active request for this item');
  }

  const request = await GiveawayRequest.create({
    resource: resourceId,
    requester: req.user._id,
    owner: resource.owner,
    message,
  });

  await notify({
    user: resource.owner,
    type: 'GIVEAWAY_REQUEST_NEW',
    message: `${req.user.name} wants to claim "${resource.title}"`,
    link: `/dashboard/incoming-requests`,
    relatedResource: resource._id,
  });

  res.status(201).json({ success: true, data: request });
});

// @desc    Get giveaway requests (mine as requester, or incoming as owner)
// @route   GET /api/giveaway-requests?role=requester|owner
// @access  Private
const getGiveawayRequests = asyncHandler(async (req, res) => {
  const { role = 'requester', status } = req.query;
  const filter = role === 'owner' ? { owner: req.user._id } : { requester: req.user._id };
  if (status) filter.status = status;

  const requests = await GiveawayRequest.find(filter)
    .populate('resource')
    .populate('requester', 'name avatar phone')
    .populate('owner', 'name avatar phone')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

// @desc    Owner accepts ONE requester for a giveaway. This is the
//          concurrency-critical operation: two owners clicking "accept" on
//          two different requests for the same resource at the same time
//          must not both succeed. We use an atomic findOneAndUpdate that
//          only succeeds if the resource is still AVAILABLE, so the second
//          racing request fails cleanly instead of double-claiming.
// @route   PUT /api/giveaway-requests/:id/accept
// @access  Private (owner only)
const acceptGiveawayRequest = asyncHandler(async (req, res) => {
  const request = await GiveawayRequest.findById(req.params.id).populate('resource');
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  if (String(request.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (request.status !== 'PENDING') {
    res.status(400);
    throw new Error(`Cannot accept a request in ${request.status} state`);
  }

  // Atomic, condition-guarded update: only flips AVAILABLE -> RESERVED.
  // If another accept already reserved this resource (or it was deleted /
  // cancelled), this returns null and we reject the request cleanly.
  const resource = await Resource.findOneAndUpdate(
    { _id: request.resource._id, status: 'AVAILABLE', isDeleted: false },
    { $set: { status: 'RESERVED', currentHolder: request.requester } },
    { new: true }
  );

  if (!resource) {
    res.status(409);
    throw new Error('This item was just claimed by someone else or is no longer available');
  }

  request.status = 'ACCEPTED';
  request.acceptedAt = new Date();
  await request.save();

  // Auto-reject every other pending request for this resource
  const others = await GiveawayRequest.find({
    resource: resource._id,
    status: 'PENDING',
    _id: { $ne: request._id },
  });
  for (const other of others) {
    other.status = 'AUTO_REJECTED';
    other.rejectedAt = new Date();
    await other.save();
    await notify({
      user: other.requester,
      type: 'GIVEAWAY_REQUEST_REJECTED',
      message: `"${resource.title}" has been claimed by another requester`,
      relatedResource: resource._id,
    });
  }

  await notify({
    user: request.requester,
    type: 'GIVEAWAY_REQUEST_ACCEPTED',
    message: `Your request for "${resource.title}" was accepted! Coordinate handover with the owner.`,
    relatedResource: resource._id,
  });

  res.json({ success: true, data: request });
});

// @desc    Owner rejects a pending giveaway request
// @route   PUT /api/giveaway-requests/:id/reject
// @access  Private (owner only)
const rejectGiveawayRequest = asyncHandler(async (req, res) => {
  const request = await GiveawayRequest.findById(req.params.id).populate('resource');
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  if (String(request.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (request.status !== 'PENDING') {
    res.status(400);
    throw new Error(`Cannot reject a request in ${request.status} state`);
  }

  request.status = 'REJECTED';
  request.rejectedAt = new Date();
  await request.save();

  await notify({
    user: request.requester,
    type: 'GIVEAWAY_REQUEST_REJECTED',
    message: `Your request for "${request.resource.title}" was declined`,
    relatedResource: request.resource._id,
  });

  res.json({ success: true, data: request });
});

// @desc    Requester cancels their own pending/accepted request
// @route   PUT /api/giveaway-requests/:id/cancel
// @access  Private (requester only)
const cancelGiveawayRequest = asyncHandler(async (req, res) => {
  const request = await GiveawayRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  if (String(request.requester) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (!['PENDING', 'ACCEPTED'].includes(request.status)) {
    res.status(400);
    throw new Error(`Cannot cancel a request in ${request.status} state`);
  }

  const wasAccepted = request.status === 'ACCEPTED';
  request.status = 'CANCELLED';
  request.cancelledAt = new Date();
  await request.save();

  if (wasAccepted) {
    // Free the resource back up for other requesters
    await Resource.findOneAndUpdate(
      { _id: request.resource, status: 'RESERVED', currentHolder: req.user._id },
      { $set: { status: 'AVAILABLE', currentHolder: null } }
    );
  }

  res.json({ success: true, data: request });
});

// @desc    Owner confirms the item has been physically handed over. This is
//          the PERMANENT, terminal step: the resource moves to HANDED_OVER
//          and can never automatically return to AVAILABLE again.
// @route   PUT /api/giveaway-requests/:id/confirm-handover
// @access  Private (owner only)
const confirmHandover = asyncHandler(async (req, res) => {
  const request = await GiveawayRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  if (String(request.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (request.status !== 'ACCEPTED') {
    res.status(400);
    throw new Error(`Cannot confirm handover from ${request.status} state`);
  }

  request.ownerConfirmedHandover = true;

  // Atomic terminal transition, guarded so it can only fire once.
  const resource = await Resource.findOneAndUpdate(
    { _id: request.resource, status: 'RESERVED' },
    { $set: { status: 'HANDED_OVER', finalizedAt: new Date() } },
    { new: true }
  );

  if (!resource) {
    res.status(409);
    throw new Error('This resource is not in a state that can be finalized');
  }

  request.status = 'HANDED_OVER';
  request.handedOverAt = new Date();
  await request.save();

  await notify({
    user: request.requester,
    type: 'GIVEAWAY_HANDED_OVER',
    message: `Handover of "${resource.title}" has been confirmed. Enjoy!`,
    relatedResource: resource._id,
  });

  res.json({ success: true, data: request });
});

// @desc    Requester confirms receipt (secondary confirmation, optional)
// @route   PUT /api/giveaway-requests/:id/confirm-receipt
// @access  Private (requester only)
const confirmReceipt = asyncHandler(async (req, res) => {
  const request = await GiveawayRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  if (String(request.requester) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (!['ACCEPTED', 'HANDED_OVER'].includes(request.status)) {
    res.status(400);
    throw new Error(`Cannot confirm receipt from ${request.status} state`);
  }

  request.requesterConfirmedReceipt = true;
  await request.save();

  res.json({ success: true, data: request });
});

module.exports = {
  createGiveawayRequest,
  getGiveawayRequests,
  acceptGiveawayRequest,
  rejectGiveawayRequest,
  cancelGiveawayRequest,
  confirmHandover,
  confirmReceipt,
};
