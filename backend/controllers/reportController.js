const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');
const Resource = require('../models/Resource');

// @desc    Report a resource
// @route   POST /api/reports
// @access  Private
const createReport = asyncHandler(async (req, res) => {
  const { resourceId, reason, details } = req.body;
  if (!resourceId || !reason) {
    res.status(400);
    throw new Error('resourceId and reason are required');
  }
  if (!Report.REASONS.includes(reason)) {
    res.status(400);
    throw new Error(`reason must be one of: ${Report.REASONS.join(', ')}`);
  }

  const resource = await Resource.findOne({ _id: resourceId, isDeleted: false });
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const report = await Report.create({
    resource: resourceId,
    reportedBy: req.user._id,
    reason,
    details,
  });

  res.status(201).json({ success: true, data: report });
});

// @desc    Get all reports (admin)
// @route   GET /api/reports
// @access  Private/Admin
const getReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const reports = await Report.find(filter)
    .populate('resource', 'title images status')
    .populate('reportedBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reports });
});

// @desc    Resolve a report (admin)
// @route   PUT /api/reports/:id
// @access  Private/Admin
const resolveReport = asyncHandler(async (req, res) => {
  const { status, resolutionNote, removeResource } = req.body;
  if (!Report.STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${Report.STATUSES.join(', ')}`);
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  report.status = status;
  report.resolutionNote = resolutionNote;
  report.resolvedBy = req.user._id;
  await report.save();

  if (removeResource) {
    await Resource.findByIdAndUpdate(report.resource, { isDeleted: true });
  }

  res.json({ success: true, data: report });
});

module.exports = { createReport, getReports, resolveReport };
