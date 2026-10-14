const asyncHandler = require('express-async-handler');
const Resource = require('../models/Resource');
const Wishlist = require('../models/Wishlist');

// @desc    Create a resource
// @route   POST /api/resources
// @access  Private
const createResource = asyncHandler(async (req, res) => {
  const { title, description, category, condition, location, sharingMode } = req.body;

  if (!title || !description || !category || !condition || !location || !sharingMode) {
    res.status(400);
    throw new Error('title, description, category, condition, location and sharingMode are all required');
  }

  if (!Resource.CATEGORIES.includes(category)) {
    res.status(400);
    throw new Error(`Invalid category. Must be one of: ${Resource.CATEGORIES.join(', ')}`);
  }
  if (!Resource.CONDITIONS.includes(condition)) {
    res.status(400);
    throw new Error(`Invalid condition. Must be one of: ${Resource.CONDITIONS.join(', ')}`);
  }
  if (!Resource.SHARING_MODES.includes(sharingMode)) {
    res.status(400);
    throw new Error(`Invalid sharingMode. Must be one of: ${Resource.SHARING_MODES.join(', ')}`);
  }

  const images = (req.files || []).map((f) => `/uploads/${f.filename}`);

  const resource = await Resource.create({
    title,
    description,
    category,
    condition,
    location,
    sharingMode,
    images,
    owner: req.user._id,
    status: 'AVAILABLE',
  });

  res.status(201).json({ success: true, data: resource });
});

// @desc    Get resources with search/filter/sort/pagination
// @route   GET /api/resources
// @access  Public
const getResources = asyncHandler(async (req, res) => {
  const {
    q, // text search
    category,
    location,
    sharingMode,
    status,
    availableOnly, // 'true' to only show AVAILABLE
    sort = 'newest',
    page = 1,
    limit = 12,
    owner,
  } = req.query;

  const filter = { isDeleted: false };

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }
  if (category) filter.category = category;
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (sharingMode) filter.sharingMode = sharingMode;
  if (status) filter.status = status;
  if (availableOnly === 'true') filter.status = 'AVAILABLE';
  if (owner) filter.owner = owner;

  let sortSpec = { createdAt: -1 };
  if (sort === 'oldest') sortSpec = { createdAt: 1 };
  if (sort === 'availability') sortSpec = { status: 1, createdAt: -1 };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [resources, total] = await Promise.all([
    Resource.find(filter)
      .populate('owner', 'name avatar')
      .sort(sortSpec)
      .skip(skip)
      .limit(limitNum),
    Resource.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: resources,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({ _id: req.params.id, isDeleted: false })
    .populate('owner', 'name avatar address')
    .populate('currentHolder', 'name avatar');

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  res.json({ success: true, data: resource });
});

// @desc    Update own resource
// @route   PUT /api/resources/:id
// @access  Private (owner only)
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({ _id: req.params.id, isDeleted: false });
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  if (String(resource.owner) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to edit this resource');
  }

  // Do not allow editing core fields once the item has left AVAILABLE state,
  // to keep the workflow's data consistent with what requesters saw.
  const lockedStatuses = ['RESERVED', 'BORROWED', 'CLAIMED_PENDING_HANDOVER', 'HANDED_OVER'];
  if (lockedStatuses.includes(resource.status) && req.user.role !== 'admin') {
    res.status(400);
    throw new Error(`Cannot edit a resource while it is in ${resource.status} state`);
  }

  const { title, description, category, condition, location } = req.body;
  if (title) resource.title = title;
  if (description) resource.description = description;
  if (category) {
    if (!Resource.CATEGORIES.includes(category)) {
      res.status(400);
      throw new Error('Invalid category');
    }
    resource.category = category;
  }
  if (condition) {
    if (!Resource.CONDITIONS.includes(condition)) {
      res.status(400);
      throw new Error('Invalid condition');
    }
    resource.condition = condition;
  }
  if (location) resource.location = location;

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((f) => `/uploads/${f.filename}`);
    resource.images = [...resource.images, ...newImages];
  }

  await resource.save();
  res.json({ success: true, data: resource });
});

// @desc    Delete (soft-delete) own resource
// @route   DELETE /api/resources/:id
// @access  Private (owner or admin)
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({ _id: req.params.id, isDeleted: false });
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  if (String(resource.owner) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to delete this resource');
  }

  const activeStatuses = ['RESERVED', 'BORROWED', 'CLAIMED_PENDING_HANDOVER'];
  if (activeStatuses.includes(resource.status) && req.user.role !== 'admin') {
    res.status(400);
    throw new Error('Cannot delete a resource that has an active borrow/giveaway in progress');
  }

  resource.isDeleted = true;
  await resource.save();
  res.json({ success: true, message: 'Resource deleted' });
});

// @desc    Admin: list ALL resources (including those with active transactions),
//          for moderation — removing fake/duplicate/inappropriate listings.
// @route   GET /api/resources/admin/all
// @access  Private/Admin
const adminGetAllResources = asyncHandler(async (req, res) => {
  const { q, category, sharingMode, status, page = 1, limit = 20 } = req.query;

  const filter = { isDeleted: false };
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }
  if (category) filter.category = category;
  if (sharingMode) filter.sharingMode = sharingMode;
  if (status) filter.status = status;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [resources, total] = await Promise.all([
    Resource.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Resource.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: resources,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
  });
});

// @desc    Remove a single image from a resource
// @route   DELETE /api/resources/:id/images
// @access  Private (owner only)
const removeResourceImage = asyncHandler(async (req, res) => {
  const { imagePath } = req.body;
  const resource = await Resource.findOne({ _id: req.params.id, isDeleted: false });
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  if (String(resource.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }
  resource.images = resource.images.filter((img) => img !== imagePath);
  await resource.save();
  res.json({ success: true, data: resource });
});

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  removeResourceImage,
  adminGetAllResources,
};
