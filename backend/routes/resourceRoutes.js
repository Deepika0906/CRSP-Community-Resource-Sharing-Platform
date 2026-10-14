const express = require('express');
const router = express.Router();
const {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  removeResourceImage,
  adminGetAllResources,
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getResources);
router.post('/', protect, upload.array('images', 5), createResource);

// Must be declared before '/:id' so "admin" is not swallowed as an :id param
router.get('/admin/all', protect, authorize('admin'), adminGetAllResources);

router.get('/:id', getResourceById);
router.put('/:id', protect, upload.array('images', 5), updateResource);
router.delete('/:id', protect, deleteResource);
router.delete('/:id/images', protect, removeResourceImage);

module.exports = router;
