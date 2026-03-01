const express = require('express');
const router = express.Router();
const collectionMemoController = require('../controllers/collectionMemoController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', collectionMemoController.createMemo);
router.put('/:id', collectionMemoController.updateMemo);
router.get('/trip/:tripId', collectionMemoController.getMemosByTrip);
router.get('/:id', collectionMemoController.getMemoById);
router.delete('/:id', collectionMemoController.deleteMemo);

module.exports = router;
