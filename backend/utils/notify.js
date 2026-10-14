const Notification = require('../models/Notification');

/**
 * Create an in-app notification. Fire-and-forget-ish but awaited so failures
 * surface in logs; never lets a notification failure break the main flow.
 */
const notify = async ({ user, type, message, link = '', relatedResource = null }) => {
  try {
    await Notification.create({ user, type, message, link, relatedResource });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

module.exports = notify;
