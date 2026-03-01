const TripAdvance = require('../models/TripAdvance');
const Trip = require('../models/Trip');
const FleetOwner = require('../models/FleetOwner');
const { createActivityLog } = require('../utils/activityLogger');

// Create advance
const createAdvance = async (req, res) => {
  try {
    const { tripId, fleetOwnerId, driverId, amount, description, paymentMethod, date } = req.body;

    // Verify trip exists
    const trip = await Trip.findById(tripId).populate('vehicleId').populate('driverId');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
    let recipientName = '';
    
    if (isFleetOwned) {
      // Fleet-owned: verify fleet owner exists
      if (!fleetOwnerId) {
        return res.status(400).json({ success: false, message: 'Fleet owner ID required for fleet-owned vehicles' });
      }
      const fleetOwner = await FleetOwner.findById(fleetOwnerId);
      if (!fleetOwner) {
        return res.status(404).json({ success: false, message: 'Fleet owner not found' });
      }
      recipientName = fleetOwner.fullName;
    } else {
      // Self-owned: driver advance (driverId can be null)
      if (driverId) {
        const Driver = require('../models/Driver');
        const driver = await Driver.findById(driverId);
        if (driver) {
          recipientName = driver.fullName;
        } else {
          recipientName = 'Driver';
        }
      } else {
        recipientName = 'Driver (Not Assigned)';
      }
    }

    const advance = await TripAdvance.create({
      tripId,
      fleetOwnerId: isFleetOwned ? fleetOwnerId : null,
      driverId: !isFleetOwned ? driverId : null,
      amount,
      description,
      paymentMethod,
      date,
      createdBy: req.user._id,
      isActive: true
    });

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Added ${isFleetOwned ? 'fleet owner' : 'driver'} advance of ₹${amount} to ${recipientName} for trip ${trip.tripNumber}`,
      actionType: 'CREATE',
      module: 'expenses',
      entityId: advance._id,
      entityType: 'TripAdvance',
      details: {
        tripId,
        tripNumber: trip.tripNumber,
        recipientId: isFleetOwned ? fleetOwnerId : driverId,
        recipientName,
        recipientType: isFleetOwned ? 'fleet_owner' : 'driver',
        amount,
        paymentMethod
      },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Advance added successfully',
      data: advance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get advances by trip
const getAdvancesByTrip = async (req, res) => {
  try {
    const advances = await TripAdvance.find({ 
      tripId: req.params.tripId,
      isActive: true 
    })
    .populate('fleetOwnerId', 'fullName contact')
    .populate('driverId', 'fullName contact')
    .populate('createdBy', 'fullName username')
    .sort({ date: -1 });

    const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);

    res.json({
      success: true,
      data: advances,
      totalAdvances
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete advance
const deleteAdvance = async (req, res) => {
  try {
    const advance = await TripAdvance.findById(req.params.id)
      .populate('tripId', 'tripNumber')
      .populate('fleetOwnerId', 'fullName');
    
    if (!advance) {
      return res.status(404).json({ success: false, message: 'Advance not found' });
    }

    // Check if this is a POD submission advance
    if (advance.advanceType === 'pod_submission') {
      // Find and remove from trip's podHistory
      const trip = await Trip.findById(advance.tripId);
      if (trip && trip.podHistory) {
        const historyIndex = trip.podHistory.findIndex(
          h => h.advanceId && h.advanceId.toString() === advance._id.toString()
        );
        
        if (historyIndex !== -1) {
          const historyEntry = trip.podHistory[historyIndex];
          
          // Restore the balance
          trip.podBalance += historyEntry.submittedAmount;
          
          // Remove from history
          trip.podHistory.splice(historyIndex, 1);
          
          await trip.save();
        }
      }
    }

    advance.isActive = false;
    await advance.save();

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Deleted ${advance.advanceType === 'pod_submission' ? 'POD submission' : 'advance'} of ₹${advance.amount} to ${advance.fleetOwnerId.fullName}`,
      actionType: 'DELETE',
      module: 'expenses',
      entityId: advance._id,
      entityType: 'TripAdvance',
      details: {
        tripId: advance.tripId._id,
        tripNumber: advance.tripId.tripNumber,
        fleetOwnerId: advance.fleetOwnerId._id,
        fleetOwnerName: advance.fleetOwnerId.fullName,
        amount: advance.amount,
        advanceType: advance.advanceType
      },
      req
    });

    res.json({
      success: true,
      message: advance.advanceType === 'pod_submission' 
        ? 'POD submission deleted and balance restored' 
        : 'Advance deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAdvance,
  getAdvancesByTrip,
  deleteAdvance
};
