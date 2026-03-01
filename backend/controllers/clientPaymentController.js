const ClientPayment = require('../models/ClientPayment');
const Trip = require('../models/Trip');
const Client = require('../models/Client');
const { createActivityLog } = require('../utils/activityLogger');

// Create payment
const createPayment = async (req, res) => {
  try {
    const { tripId, clientId, amount, paymentMethod, notes, purpose, paymentDate } = req.body;

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

    const payment = await ClientPayment.create({
      tripId,
      clientId,
      amount,
      paymentMethod,
      notes,
      purpose,
      paymentDate,
      createdBy: req.user._id
    });

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Added client payment of ₹${amount} from ${client.fullName} for trip ${trip.tripNumber}`,
      actionType: 'CREATE',
      module: 'payments',
      entityId: payment._id,
      entityType: 'ClientPayment',
      details: {
        tripId,
        tripNumber: trip.tripNumber,
        clientId,
        clientName: client.fullName,
        amount,
        paymentMethod,
        purpose
      },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Payment added successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payments by trip and client
const getPaymentsByTripAndClient = async (req, res) => {
  try {
    const { tripId, clientId } = req.params;
    
    const payments = await ClientPayment.find({ 
      tripId,
      clientId,
      isActive: true 
    })
    .populate('clientId', 'fullName companyName')
    .populate('createdBy', 'fullName username')
    .sort({ paymentDate: -1 });

    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.json({
      success: true,
      data: payments,
      totalPayments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const payment = await ClientPayment.findById(req.params.id)
      .populate('tripId', 'tripNumber')
      .populate('clientId', 'fullName');
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    payment.isActive = false;
    await payment.save();

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Deleted client payment of ₹${payment.amount} from ${payment.clientId.fullName}`,
      actionType: 'DELETE',
      module: 'payments',
      entityId: payment._id,
      entityType: 'ClientPayment',
      details: {
        tripId: payment.tripId._id,
        tripNumber: payment.tripId.tripNumber,
        clientId: payment.clientId._id,
        clientName: payment.clientId.fullName,
        amount: payment.amount
      },
      req
    });

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  getPaymentsByTripAndClient,
  deletePayment
};
