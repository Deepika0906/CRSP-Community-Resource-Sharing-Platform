const mongoose = require('mongoose');

// A conversation is scoped to one resource + one requester (the two
// participants are the resource owner and that requester). This keeps
// access control simple: only those two users may read/write it.
const messageSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

messageSchema.index({ resource: 1, participants: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
