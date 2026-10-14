const mongoose = require('mongoose');

const TYPES = [
  'BORROW_REQUEST_NEW',
  'BORROW_REQUEST_ACCEPTED',
  'BORROW_REQUEST_REJECTED',
  'BORROW_RETURN_REMINDER',
  'BORROW_RETURNED',
  'GIVEAWAY_REQUEST_NEW',
  'GIVEAWAY_REQUEST_ACCEPTED',
  'GIVEAWAY_REQUEST_REJECTED',
  'GIVEAWAY_HANDED_OVER',
  'WISHLIST_AVAILABLE',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TYPES, required: true },
    message: { type: String, required: true },
    link: { type: String }, // frontend route to navigate to, e.g. /resources/:id
    isRead: { type: Boolean, default: false },
    relatedResource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

notificationSchema.statics.TYPES = TYPES;

module.exports = mongoose.model('Notification', notificationSchema);
