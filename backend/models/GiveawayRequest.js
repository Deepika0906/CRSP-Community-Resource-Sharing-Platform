const mongoose = require('mongoose');

// Giveaway request lifecycle:
// PENDING -> ACCEPTED -> HANDED_OVER (terminal, permanent transfer complete)
// PENDING -> REJECTED (terminal)
// PENDING -> CANCELLED (terminal, cancelled by requester)
// Any other PENDING requests for the same resource become AUTO_REJECTED once
// one requester is accepted.
const STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'AUTO_REJECTED', 'HANDED_OVER', 'CANCELLED'];

const giveawayRequestSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: STATUSES, default: 'PENDING' },

    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    handedOverAt: { type: Date },
    cancelledAt: { type: Date },

    // Confirmation flags for the handover step
    ownerConfirmedHandover: { type: Boolean, default: false },
    requesterConfirmedReceipt: { type: Boolean, default: false },
  },
  { timestamps: true }
);

giveawayRequestSchema.index({ resource: 1, status: 1 });
giveawayRequestSchema.index({ requester: 1 });
giveawayRequestSchema.index({ owner: 1 });

// Prevent the same user from having more than one *active* (PENDING/ACCEPTED)
// request on the same resource at the database level is enforced in the
// controller (partial unique indexes on enum arrays are awkward in Mongo);
// see giveawayController for the atomic guard.

giveawayRequestSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('GiveawayRequest', giveawayRequestSchema);
