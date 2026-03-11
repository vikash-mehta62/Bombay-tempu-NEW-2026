const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const { createActivityLog } = require('../utils/activityLogger');

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, expenseType, vehicleId, notes, date } = req.body;

    // Check for duplicate entry within last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const duplicateCheck = await Expense.findOne({
      amount,
      expenseType,
      vehicleId: vehicleId || null,
      createdBy: req.user._id,
      isActive: true,
      createdAt: { $gte: fifteenMinutesAgo }
    });

    if (duplicateCheck) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate entry detected. Same expense was added within last 30 seconds.' 
      });
    }

    // If vehicle expense, verify vehicle exists
    let vehicleName = '';
    if (expenseType === 'vehicle' && vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
      vehicleName = vehicle.vehicleNumber;
    }

    const expense = await Expense.create({
      amount,
      expenseType,
      vehicleId: expenseType === 'vehicle' ? vehicleId : null,
      notes,
      date: date || new Date(),
      createdBy: req.user._id,
      isActive: true
    });

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Added ${expenseType} expense of ₹${amount}${vehicleName ? ` for vehicle ${vehicleName}` : ''}`,
      actionType: 'CREATE',
      module: 'expenses',
      entityId: expense._id,
      entityType: 'Expense',
      details: {
        amount,
        expenseType,
        vehicleId,
        vehicleName
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

// Get all expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const { expenseType, vehicleId, startDate, endDate } = req.query;
    
    let query = { isActive: true };
    
    if (expenseType) {
      query.expenseType = expenseType;
    }
    
    if (vehicleId) {
      query.vehicleId = vehicleId;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const expenses = await Expense.find(query)
      .populate('vehicleId', 'vehicleNumber vehicleType brand model')
      .populate('createdBy', 'fullName username')
      .sort({ date: -1 });
    
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    res.json({
      success: true,
      data: expenses,
      totalAmount,
      count: expenses.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get expenses by vehicle
exports.getExpensesByVehicle = async (req, res) => {
  try {
    const Trip = require('../models/Trip');
    const TripExpense = require('../models/TripExpense');
    const TripAdvance = require('../models/TripAdvance');
    
    // Get general vehicle expenses
    const generalExpenses = await Expense.find({ 
      vehicleId: req.params.vehicleId,
      isActive: true 
    })
    .populate('createdBy', 'fullName username')
    .sort({ date: -1 });

    // Get all trips for this vehicle
    const trips = await Trip.find({
      vehicleId: req.params.vehicleId,
      isActive: true
    }).select('_id tripNumber loadDate totalClientRevenue');

    // Get trip expenses for all vehicle trips
    const tripIds = trips.map(t => t._id);
    const tripExpenses = await TripExpense.find({
      tripId: { $in: tripIds },
      isActive: true
    })
    .populate('tripId', 'tripNumber')
    .populate('createdBy', 'fullName username')
    .sort({ date: -1 });

    // Get trip advances for all vehicle trips
    const tripAdvances = await TripAdvance.find({
      tripId: { $in: tripIds },
      isActive: true
    })
    .populate('tripId', 'tripNumber')
    .populate('driverId', 'fullName')
    .populate('fleetOwnerId', 'fullName')
    .populate('createdBy', 'fullName username')
    .sort({ date: -1 });

    // Calculate totals
    const totalGeneralExpenses = generalExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalTripExpenses = tripExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalAdvances = tripAdvances.reduce((sum, adv) => sum + adv.amount, 0);
    const totalIncome = trips.reduce((sum, trip) => sum + (trip.totalClientRevenue || 0), 0);
    const totalOutflow = totalGeneralExpenses + totalTripExpenses + totalAdvances;
    const netProfit = totalIncome - totalOutflow;

    res.json({
      success: true,
      data: {
        generalExpenses,
        tripExpenses,
        tripAdvances,
        trips
      },
      stats: {
        totalIncome,
        totalGeneralExpenses,
        totalTripExpenses,
        totalAdvances,
        totalOutflow,
        netProfit,
        tripCount: trips.length
      },
      // Legacy support
      totalAmount: totalGeneralExpenses,
      count: generalExpenses.length
    });
  } catch (error) {
    console.error('Error in getExpensesByVehicle:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get expense statistics
exports.getExpenseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = { isActive: true };
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const stats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$expenseType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    const totalExpenses = await Expense.countDocuments(matchQuery);
    const totalAmount = stats.reduce((sum, stat) => sum + stat.totalAmount, 0);
    
    // Get weekly and monthly totals
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const weeklyTotal = await Expense.aggregate([
      { $match: { isActive: true, date: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    const monthlyTotal = await Expense.aggregate([
      { $match: { isActive: true, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        byType: stats,
        totalExpenses,
        totalAmount,
        weeklyTotal: weeklyTotal[0] || { total: 0, count: 0 },
        monthlyTotal: monthlyTotal[0] || { total: 0, count: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('vehicleId', 'vehicleNumber');
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    expense.isActive = false;
    await expense.save();

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Deleted ${expense.expenseType} expense of ₹${expense.amount}`,
      actionType: 'DELETE',
      module: 'expenses',
      entityId: expense._id,
      entityType: 'Expense',
      details: {
        amount: expense.amount,
        expenseType: expense.expenseType,
        vehicleId: expense.vehicleId?._id,
        vehicleNumber: expense.vehicleId?.vehicleNumber
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
