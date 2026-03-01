const express = require('express');
const router = express.Router();
const driverCalculationController = require('../controllers/driverCalculationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create calculation
router.post('/', driverCalculationController.createCalculation);

// Get calculations by driver
router.get('/driver/:driverId', driverCalculationController.getByDriver);

// Get calculation by ID
router.get('/:id', driverCalculationController.getById);

// Update calculation
router.put('/:id', driverCalculationController.updateCalculation);

// Delete calculation
router.delete('/:id', driverCalculationController.deleteCalculation);

module.exports = router;
