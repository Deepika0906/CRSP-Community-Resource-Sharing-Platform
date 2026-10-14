const mongoose = require('mongoose');

const REASONS = ['FAKE_LISTING', 'DAMAGED_RESOURCE', 'INAPPROPRIATE_CONTENT', 'OTHER'];
const STATUSES = ['PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'];

const reportSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, enum: REASONS, required: true },
    details: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: STATUSES, default: 'PENDING' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNote: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

reportSchema.statics.REASONS = REASONS;
reportSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Report', reportSchema);
