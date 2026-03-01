const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all cities
router.get('/', cityController.getAllCities);

// Get city by ID
router.get('/:id', cityController.getCityById);

// Create new city
router.post('/', authorize('admin'), cityController.createCity);

module.exports = router;
