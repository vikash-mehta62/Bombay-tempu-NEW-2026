const express = require('express');
const router = express.Router();
const lrController = require('../controllers/lrController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', lrController.createLR);
router.get('/', lrController.getAllLRs);
router.get('/:id', lrController.getLRById);
router.put('/:id', lrController.updateLR);
router.delete('/:id', lrController.deleteLR);

module.exports = router;
