const express = require('express');
const router = express.Router();
const {
  getAllFleetOwners,
  getFleetOwnerById,
  createFleetOwner,
  updateFleetOwner,
  deleteFleetOwner,
  getFleetOwnerVehicles
} = require('../controllers/fleetOwnerController');
const { protect, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// All routes require authentication
router.use(protect);

// CRUD routes with activity logging
router
  .route('/')
  .get(
    logActivity('Viewed fleet owners list', 'READ', 'fleet_owners'),
    getAllFleetOwners
  )
  .post(
    authorize('admin'),
    logActivity('Created new fleet owner', 'CREATE', 'fleet_owners'),
    createFleetOwner
  );

router
  .route('/:id')
  .get(
    logActivity('Viewed fleet owner details', 'READ', 'fleet_owners'),
    getFleetOwnerById
  )
  .put(
    authorize('admin'),
    logActivity('Updated fleet owner', 'UPDATE', 'fleet_owners'),
    updateFleetOwner
  )
  .delete(
    authorize('admin'),
    logActivity('Deleted fleet owner', 'DELETE', 'fleet_owners'),
    deleteFleetOwner
  );

// Get fleet owner's vehicles
router.get(
  '/:id/vehicles',
  logActivity('Viewed fleet owner vehicles', 'READ', 'fleet_owners'),
  getFleetOwnerVehicles
);

module.exports = router;
