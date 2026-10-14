const express = require('express');
const router = express.Router();
const { createReport, getReports, resolveReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createReport);
router.get('/', protect, authorize('admin'), getReports);
router.put('/:id', protect, authorize('admin'), resolveReport);

module.exports = router;
