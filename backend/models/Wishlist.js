const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate wishlist entries
wishlistSchema.index({ user: 1, resource: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
