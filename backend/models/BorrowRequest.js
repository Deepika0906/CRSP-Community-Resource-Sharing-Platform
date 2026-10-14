const mongoose = require('mongoose');

// Borrow request lifecycle:
// PENDING -> ACCEPTED -> COLLECTED -> RETURNED (terminal, resource back to AVAILABLE)
// PENDING -> REJECTED (terminal)
// PENDING -> CANCELLED (terminal, cancelled by requester)
const STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'COLLECTED', 'RETURNED', 'CANCELLED'];

const borrowRequestSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: STATUSES, default: 'PENDING' },

    requestedFrom: { type: Date },
    requestedTo: { type: Date },

    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    collectedAt: { type: Date },
    returnedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

borrowRequestSchema.index({ resource: 1, status: 1 });
borrowRequestSchema.index({ requester: 1 });
borrowRequestSchema.index({ owner: 1 });

borrowRequestSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
