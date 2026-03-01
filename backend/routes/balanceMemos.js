const express = require('express');
const router = express.Router();
const balanceMemoController = require('../controllers/balanceMemoController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', balanceMemoController.createMemo);
router.put('/:id', balanceMemoController.updateMemo);
router.get('/trip/:tripId', balanceMemoController.getMemosByTrip);
router.get('/:id', balanceMemoController.getMemoById);
router.delete('/:id', balanceMemoController.deleteMemo);

module.exports = router;
