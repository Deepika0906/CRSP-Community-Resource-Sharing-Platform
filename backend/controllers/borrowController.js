const asyncHandler = require('express-async-handler');
const Resource = require('../models/Resource');
const BorrowRequest = require('../models/BorrowRequest');
const notify = require('../utils/notify');

// @desc    Send a borrow request for a LEND resource
// @route   POST /api/borrow-requests
// @access  Private
const createBorrowRequest = asyncHandler(async (req, res) => {
  const { resourceId, message, requestedFrom, requestedTo } = req.body;
  if (!resourceId) {
    res.status(400);
    throw new Error('resourceId is required');
  }

  const resource = await Resource.findOne({ _id: resourceId, isDeleted: false });
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  if (resource.sharingMode !== 'LEND') {
    res.status(400);
    throw new Error('This resource is not available for lending/borrowing');
  }
  if (String(resource.owner) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot borrow your own resource');
  }
  if (resource.status !== 'AVAILABLE') {
    res.status(400);
    throw new Error('This resource is not currently available');
  }

  const existingActive = await BorrowRequest.findOne({
    resource: resourceId,
    requester: req.user._id,
    status: { $in: ['PENDING', 'ACCEPTED', 'COLLECTED'] },
  });
  if (existingActive) {
    res.status(400);
    throw new Error('You already have an active request for this resource');
  }

  const borrowRequest = await BorrowRequest.create({
    resource: resourceId,
    requester: req.user._id,
    owner: resource.owner,
    message,
    requestedFrom,
    requestedTo,
  });

  await notify({
    user: resource.owner,
    type: 'BORROW_REQUEST_NEW',
    message: `${req.user.name} requested to borrow "${resource.title}"`,
    link: `/dashboard/incoming-requests`,
    relatedResource: resource._id,
  });

  res.status(201).json({ success: true, data: borrowRequest });
});

// @desc    Get borrow requests (mine as requester, or incoming as owner)
// @route   GET /api/borrow-requests?role=requester|owner
// @access  Private
const getBorrowRequests = asyncHandler(async (req, res) => {
  const { role = 'requester', status } = req.query;
  const filter = role === 'owner' ? { owner: req.user._id } : { requester: req.user._id };
  if (status) filter.status = status;

  const requests = await BorrowRequest.find(filter)
    .populate('resource')
    .populate('requester', 'name avatar phone')
    .populate('owner', 'name avatar phone')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

// @desc    Owner accepts a request
// @route   PUT /api/borrow-requests/:id/accept
// @access  Private (owner only)
const acceptBorrowRequest = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id).populate('resource');
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

  const resource = await Resource.findById(request.resource._id);
  if (resource.status !== 'AVAILABLE') {
    res.status(400);
    throw new Error('Resource is no longer available');
  }

  request.status = 'ACCEPTED';
  request.acceptedAt = new Date();
  await request.save();

  resource.status = 'RESERVED';
  resource.currentHolder = request.requester;
  await resource.save();

  // Reject other pending requests for the same resource
  const others = await BorrowRequest.find({
    resource: resource._id,
    status: 'PENDING',
    _id: { $ne: request._id },
  });
  for (const other of others) {
    other.status = 'REJECTED';
    other.rejectedAt = new Date();
    await other.save();
    await notify({
      user: other.requester,
      type: 'BORROW_REQUEST_REJECTED',
      message: `Your borrow request for "${resource.title}" was declined (another request was accepted)`,
      relatedResource: resource._id,
    });
  }

  await notify({
    user: request.requester,
    type: 'BORROW_REQUEST_ACCEPTED',
    message: `Your borrow request for "${resource.title}" was accepted!`,
    relatedResource: resource._id,
  });

  res.json({ success: true, data: request });
});

// @desc    Owner rejects a request
// @route   PUT /api/borrow-requests/:id/reject
// @access  Private (owner only)
const rejectBorrowRequest = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id).populate('resource');
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
    type: 'BORROW_REQUEST_REJECTED',
    message: `Your borrow request for "${request.resource.title}" was declined`,
    relatedResource: request.resource._id,
  });

  res.json({ success: true, data: request });
});

// @desc    Requester cancels their own pending request
// @route   PUT /api/borrow-requests/:id/cancel
// @access  Private (requester only)
const cancelBorrowRequest = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id);
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

  request.status = 'CANCELLED';
  request.cancelledAt = new Date();
  await request.save();

  if (request.status === 'CANCELLED') {
    const resource = await Resource.findById(request.resource);
    if (resource && resource.status === 'RESERVED' && String(resource.currentHolder) === String(req.user._id)) {
      resource.status = 'AVAILABLE';
      resource.currentHolder = null;
      await resource.save();
    }
  }

  res.json({ success: true, data: request });
});

// @desc    Mark item as collected by the borrower (owner confirms handoff)
// @route   PUT /api/borrow-requests/:id/collect
// @access  Private (owner only)
const markCollected = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id);
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
    throw new Error(`Cannot mark collected from ${request.status} state`);
  }

  request.status = 'COLLECTED';
  request.collectedAt = new Date();
  await request.save();

  const resource = await Resource.findById(request.resource);
  resource.status = 'BORROWED';
  await resource.save();

  res.json({ success: true, data: request });
});

// @desc    Owner confirms the item has been returned
// @route   PUT /api/borrow-requests/:id/return
// @access  Private (owner only)
const confirmReturn = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  if (String(request.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (request.status !== 'COLLECTED') {
    res.status(400);
    throw new Error(`Cannot confirm return from ${request.status} state`);
  }

  request.status = 'RETURNED';
  request.returnedAt = new Date();
  await request.save();

  const resource = await Resource.findById(request.resource);
  resource.status = 'AVAILABLE';
  resource.currentHolder = null;
  await resource.save();

  await notify({
    user: request.requester,
    type: 'BORROW_RETURNED',
    message: `Return of "${resource.title}" has been confirmed. Thanks!`,
    relatedResource: resource._id,
  });

  res.json({ success: true, data: request });
});

module.exports = {
  createBorrowRequest,
  getBorrowRequests,
  acceptBorrowRequest,
  rejectBorrowRequest,
  cancelBorrowRequest,
  markCollected,
  confirmReturn,
};
