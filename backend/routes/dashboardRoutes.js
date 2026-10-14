const express = require('express');
const router = express.Router();
const { getUserDashboard, getAdminDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getUserDashboard);
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

module.exports = router;
