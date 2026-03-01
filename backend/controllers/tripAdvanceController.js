const TripAdvance = require('../models/TripAdvance');
const Trip = require('../models/Trip');
const FleetOwner = require('../models/FleetOwner');
const { createActivityLog } = require('../utils/activityLogger');

// Create advance
const createAdvance = async (req, res) => {
  try {
    const { tripId, fleetOwnerId, driverId, amount, description, paymentMethod, date } = req.body;

    // Check for duplicate entry within last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const duplicateCheck = await TripAdvance.findOne({
      tripId,
      amount,
      createdBy: req.user._id,
      isActive: true,
      createdAt: { $gte: fifteenMinutesAgo }
    });

    if (duplicateCheck) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate entry detected. Same advance was added within last 15 minutes.' 
      });
    }

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
      amount: Number(amount), // Convert to number
      description,
      paymentMethod,
      date,
      createdBy: req.user._id,
      isActive: true
    });

    console.log('Advance created:', {
      advanceId: advance._id,
      isFleetOwned,
      recipientName,
      amount: Number(amount),
      tripId
    });

    // Recalculate profit for self-owned vehicles
    if (!isFleetOwned) {
      const TripExpense = require('../models/TripExpense');
      
      // Get all expenses for this trip
      const allExpenses = await TripExpense.find({ tripId, isActive: true });
      const totalExpenses = allExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      // Get all advances for this trip
      const allAdvances = await TripAdvance.find({ tripId, isActive: true });
      const totalAdvances = allAdvances.reduce((sum, adv) => sum + Number(adv.amount), 0);
      
      console.log('Debug - All advances found:', {
        count: allAdvances.length,
        advances: allAdvances.map(a => ({ id: a._id, amount: a.amount, isActive: a.isActive })),
        totalAdvances
      });
      
      // Update profit: Revenue - Expenses - Advances (ensure all are numbers)
      const revenue = Number(trip.totalClientRevenue) || 0;
      const expenses = Number(totalExpenses) || 0;
      const advances = Number(totalAdvances) || 0;
      
      trip.profitLoss = revenue - expenses - advances;
      await trip.save();
      
      console.log('Profit recalculated for self-owned vehicle:', {
        tripId: trip._id,
        revenue,
        totalExpenses: expenses,
        totalAdvances: advances,
        calculation: `${revenue} - ${expenses} - ${advances} = ${trip.profitLoss}`,
        newProfit: trip.profitLoss
      });
    }

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
      .populate('fleetOwnerId', 'fullName')
      .populate('driverId', 'fullName');
    
    if (!advance) {
      return res.status(404).json({ success: false, message: 'Advance not found' });
    }

    // Determine if fleet-owned or self-owned
    const isFleetOwned = advance.fleetOwnerId !== null;
    const recipientName = isFleetOwned 
      ? (advance.fleetOwnerId?.fullName || 'Fleet Owner')
      : (advance.driverId?.fullName || 'Driver');

    console.log('Deleting advance:', {
      advanceId: advance._id,
      isFleetOwned,
      recipientName,
      amount: advance.amount,
      advanceType: advance.advanceType
    });

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

    // Recalculate profit for self-owned vehicles
    const trip = await Trip.findById(advance.tripId).populate('vehicleId');
    if (trip && trip.vehicleId?.ownershipType === 'self_owned') {
      const TripExpense = require('../models/TripExpense');
      
      // Get all active expenses for this trip
      const allExpenses = await TripExpense.find({ tripId: advance.tripId, isActive: true });
      const totalExpenses = allExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      // Get all active advances for this trip
      const allAdvances = await TripAdvance.find({ tripId: advance.tripId, isActive: true });
      const totalAdvances = allAdvances.reduce((sum, adv) => sum + Number(adv.amount), 0);
      
      // Update profit: Revenue - Expenses - Advances (ensure all are numbers)
      const revenue = Number(trip.totalClientRevenue) || 0;
      const expenses = Number(totalExpenses) || 0;
      const advances = Number(totalAdvances) || 0;
      
      trip.profitLoss = revenue - expenses - advances;
      await trip.save();
      
      console.log('Profit recalculated for self-owned vehicle:', {
        tripId: trip._id,
        revenue,
        totalExpenses: expenses,
        totalAdvances: advances,
        calculation: `${revenue} - ${expenses} - ${advances} = ${trip.profitLoss}`,
        newProfit: trip.profitLoss
      });
    }

    // Log activity
    const activityDetails = {
      tripId: advance.tripId._id,
      tripNumber: advance.tripId.tripNumber,
      amount: advance.amount,
      advanceType: advance.advanceType,
      recipientType: isFleetOwned ? 'fleet_owner' : 'driver'
    };

    if (isFleetOwned && advance.fleetOwnerId) {
      activityDetails.fleetOwnerId = advance.fleetOwnerId._id;
      activityDetails.fleetOwnerName = advance.fleetOwnerId.fullName;
    } else if (!isFleetOwned && advance.driverId) {
      activityDetails.driverId = advance.driverId._id;
      activityDetails.driverName = advance.driverId.fullName;
    }

    await createActivityLog({
      user: req.user,
      action: `Deleted ${advance.advanceType === 'pod_submission' ? 'POD submission' : 'advance'} of ₹${advance.amount} to ${recipientName}`,
      actionType: 'DELETE',
      module: 'expenses',
      entityId: advance._id,
      entityType: 'TripAdvance',
      details: activityDetails,
      req
    });

    res.json({
      success: true,
      message: advance.advanceType === 'pod_submission' 
        ? 'POD submission deleted and balance restored' 
        : 'Advance deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting advance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAdvance,
  getAdvancesByTrip,
  deleteAdvance
};
