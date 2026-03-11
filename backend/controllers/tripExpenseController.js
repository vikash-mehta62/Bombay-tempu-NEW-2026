const TripExpense = require('../models/TripExpense');
const Trip = require('../models/Trip');
const FleetOwner = require('../models/FleetOwner');
const { createActivityLog } = require('../utils/activityLogger');

// Create expense
const createExpense = async (req, res) => {
  try {
    const { tripId, fleetOwnerId, vehicleId, expenseType, amount, description, additionalNotes, receiptNumber, date } = req.body;

    // Check for duplicate entry within last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const duplicateCheck = await TripExpense.findOne({
      tripId,
      expenseType,
      amount,
      createdBy: req.user._id,
      isActive: true,
      createdAt: { $gte: thirtySecondsAgo }
    });

    if (duplicateCheck) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate entry detected. Same expense was added within last 30 seconds.' 
      });
    }

    // Verify trip exists
    const trip = await Trip.findById(tripId).populate('vehicleId');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
    let expenseTarget = '';

    if (isFleetOwned) {
      // Fleet-owned: verify fleet owner
      if (fleetOwnerId) {
        const fleetOwner = await FleetOwner.findById(fleetOwnerId);
        if (!fleetOwner) {
          return res.status(404).json({ success: false, message: 'Fleet owner not found' });
        }
        expenseTarget = `fleet owner ${fleetOwner.fullName}`;
      } else {
        expenseTarget = 'fleet owner';
      }
    } else {
      // Self-owned: expense linked to vehicle
      if (vehicleId) {
        const Vehicle = require('../models/Vehicle');
        const vehicle = await Vehicle.findById(vehicleId);
        if (vehicle) {
          expenseTarget = `vehicle ${vehicle.vehicleNumber}`;
        } else {
          expenseTarget = 'vehicle';
        }
      } else {
        expenseTarget = 'vehicle';
      }
    }

    const expense = await TripExpense.create({
      tripId,
      fleetOwnerId: isFleetOwned ? (fleetOwnerId || null) : null,
      vehicleId: !isFleetOwned ? (vehicleId || null) : null,
      expenseType,
      amount: Number(amount), // Convert to number
      description,
      additionalNotes,
      receiptNumber,
      date,
      createdBy: req.user._id,
      isActive: true
    });

    console.log('Expense created:', {
      expenseId: expense._id,
      isFleetOwned,
      expenseTarget,
      amount: Number(amount),
      tripId
    });

    // Recalculate profit for self-owned vehicles
    if (!isFleetOwned) {
      const TripAdvance = require('../models/TripAdvance');
      
      // Get all expenses for this trip
      const allExpenses = await TripExpense.find({ tripId, isActive: true });
      const totalExpenses = allExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      // Get all advances for this trip
      const allAdvances = await TripAdvance.find({ tripId, isActive: true });
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
    await createActivityLog({
      user: req.user,
      action: `Added ${expenseType} expense of ₹${amount} for ${expenseTarget} in trip ${trip.tripNumber}`,
      actionType: 'CREATE',
      module: 'expenses',
      entityId: expense._id,
      entityType: 'TripExpense',
      details: {
        tripId,
        tripNumber: trip.tripNumber,
        expenseType,
        amount,
        targetType: isFleetOwned ? 'fleet_owner' : 'vehicle',
        targetId: isFleetOwned ? fleetOwnerId : vehicleId,
        targetName: expenseTarget
      },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get expenses by trip
const getExpensesByTrip = async (req, res) => {
  try {
    const expenses = await TripExpense.find({ 
      tripId: req.params.tripId,
      isActive: true 
    })
    .populate('fleetOwnerId', 'fullName contact')
    .populate('vehicleId', 'vehicleNumber brand model')
    .populate('createdBy', 'fullName username')
    .sort({ date: -1 });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      success: true,
      data: expenses,
      totalExpenses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const expense = await TripExpense.findById(req.params.id).populate('tripId', 'tripNumber');
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    expense.isActive = false;
    await expense.save();

    console.log('Expense deleted:', {
      expenseId: expense._id,
      amount: expense.amount,
      tripId: expense.tripId._id
    });

    // Recalculate profit for self-owned vehicles
    const trip = await Trip.findById(expense.tripId).populate('vehicleId');
    if (trip && trip.vehicleId?.ownershipType === 'self_owned') {
      const TripAdvance = require('../models/TripAdvance');
      
      // Get all active expenses for this trip
      const allExpenses = await TripExpense.find({ tripId: expense.tripId, isActive: true });
      const totalExpenses = allExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      // Get all active advances for this trip
      const allAdvances = await TripAdvance.find({ tripId: expense.tripId, isActive: true });
      const totalAdvances = allAdvances.reduce((sum, adv) => sum + Number(adv.amount), 0);
      
      // Update profit: Revenue - Expenses - Advances (ensure all are numbers)
      const revenue = Number(trip.totalClientRevenue) || 0;
      const expenses = Number(totalExpenses) || 0;
      const advances = Number(totalAdvances) || 0;
      
      trip.profitLoss = revenue - expenses - advances;
      await trip.save();
      
      console.log('Profit recalculated after expense deletion:', {
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
      action: `Deleted ${expense.expenseType} expense of ₹${expense.amount}`,
      actionType: 'DELETE',
      module: 'expenses',
      entityId: expense._id,
      entityType: 'TripExpense',
      details: {
        tripId: expense.tripId._id,
        tripNumber: expense.tripId.tripNumber,
        expenseType: expense.expenseType,
        amount: expense.amount
      },
      req
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createExpense,
  getExpensesByTrip,
  deleteExpense
};
