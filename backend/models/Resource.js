const mongoose = require('mongoose');

const CATEGORIES = [
  'Books',
  'Electronics',
  'Sports Equipment',
  'Stationery',
  'Clothing',
  'Furniture',
  'Others',
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const SHARING_MODES = ['LEND', 'GIVEAWAY'];

// Unified status model used by both lend and giveaway workflows.
// LEND flow:     AVAILABLE -> RESERVED -> BORROWED -> AVAILABLE
// GIVEAWAY flow: AVAILABLE -> RESERVED -> CLAIMED_PENDING_HANDOVER -> HANDED_OVER (terminal)
const STATUSES = [
  'AVAILABLE',
  'RESERVED',
  'BORROWED',
  'CLAIMED_PENDING_HANDOVER',
  'HANDED_OVER',
  'CANCELLED',
];

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, required: true, enum: CATEGORIES },
    condition: { type: String, required: true, enum: CONDITIONS },
    images: [{ type: String }], // paths/URLs
    location: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharingMode: { type: String, required: true, enum: SHARING_MODES },
    status: { type: String, enum: STATUSES, default: 'AVAILABLE' },

    // Set once a borrow/giveaway request is accepted
    currentHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // For GIVEAWAY: once HANDED_OVER, this resource is permanently done and
    // must never automatically become AVAILABLE again.
    finalizedAt: { type: Date, default: null },

    isDeleted: { type: Boolean, default: false }, // soft delete
  },
  { timestamps: true }
);

resourceSchema.index({ title: 'text', description: 'text' });
resourceSchema.index({ category: 1 });
resourceSchema.index({ sharingMode: 1 });
resourceSchema.index({ status: 1 });
resourceSchema.index({ location: 1 });
resourceSchema.index({ owner: 1 });

resourceSchema.statics.CATEGORIES = CATEGORIES;
resourceSchema.statics.CONDITIONS = CONDITIONS;
resourceSchema.statics.SHARING_MODES = SHARING_MODES;
resourceSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Resource', resourceSchema);
