const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // owner being reviewed
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
    // The transaction this review is tied to, so we can prevent duplicates
    // and prevent reviews before completion.
    transactionType: { type: String, enum: ['BORROW', 'GIVEAWAY'], required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, required: true }, // BorrowRequest or GiveawayRequest id
  },
  { timestamps: true }
);

// One review per transaction per reviewer
reviewSchema.index({ transactionType: 1, transactionId: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1 });

module.exports = mongoose.model('Review', reviewSchema);
