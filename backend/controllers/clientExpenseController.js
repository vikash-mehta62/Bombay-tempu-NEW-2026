const ClientExpense = require('../models/ClientExpense');
const Trip = require('../models/Trip');
const Client = require('../models/Client');
const { createActivityLog } = require('../utils/activityLogger');

// Create expense
const createExpense = async (req, res) => {
  try {
    const { tripId, clientId, amount, paidBy, expenseType, description, paymentDate } = req.body;

    // Check for duplicate entry within last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const duplicateCheck = await ClientExpense.findOne({
      tripId,
      clientId,
      amount,
      expenseType,
      createdBy: req.user._id,
      isActive: true,
      createdAt: { $gte: fifteenMinutesAgo }
    });

    if (duplicateCheck) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate entry detected. Same client expense was added within last 15 minutes.' 
      });
    }

    // Verify trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const expense = await ClientExpense.create({
      tripId,
      clientId,
      amount,
      paidBy,
      expenseType,
      description,
      paymentDate,
      createdBy: req.user._id
    });

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Added client expense of ₹${amount} (${expenseType}) for ${client.fullName} in trip ${trip.tripNumber}`,
      actionType: 'CREATE',
      module: 'expenses',
      entityId: expense._id,
      entityType: 'ClientExpense',
      details: {
        tripId,
        tripNumber: trip.tripNumber,
        clientId,
        clientName: client.fullName,
        amount,
        expenseType,
        paidBy
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

// Get expenses by trip and client
const getExpensesByTripAndClient = async (req, res) => {
  try {
    const { tripId, clientId } = req.params;
    
    const expenses = await ClientExpense.find({ 
      tripId,
      clientId,
      isActive: true 
    })
    .populate('clientId', 'fullName companyName')
    .populate('createdBy', 'fullName username')
    .sort({ paymentDate: -1 });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

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
    const expense = await ClientExpense.findById(req.params.id)
      .populate('tripId', 'tripNumber')
      .populate('clientId', 'fullName');
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    expense.isActive = false;
    await expense.save();

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Deleted client expense of ₹${expense.amount} (${expense.expenseType}) for ${expense.clientId.fullName}`,
      actionType: 'DELETE',
      module: 'expenses',
      entityId: expense._id,
      entityType: 'ClientExpense',
      details: {
        tripId: expense.tripId._id,
        tripNumber: expense.tripId.tripNumber,
        clientId: expense.clientId._id,
        clientName: expense.clientId.fullName,
        amount: expense.amount,
        expenseType: expense.expenseType
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
  getExpensesByTripAndClient,
  deleteExpense
};
