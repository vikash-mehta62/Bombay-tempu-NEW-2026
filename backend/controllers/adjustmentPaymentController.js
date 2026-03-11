const AdjustmentPayment = require('../models/AdjustmentPayment');
const Trip = require('../models/Trip');
const ActivityLog = require('../models/ActivityLog');

// Create adjustment payment
exports.createAdjustmentPayment = async (req, res) => {
  try {
    const { tripId, clientId, amount, paymentMode, paymentDate, remarks } = req.body;
    
    // Check for duplicate entry within last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const duplicateCheck = await AdjustmentPayment.findOne({
      tripId,
      clientId,
      amount,
      createdBy: req.user._id,
      createdAt: { $gte: thirtySecondsAgo }
    });

    if (duplicateCheck) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate entry detected. Same adjustment payment was added within last 30 seconds.' 
      });
    }
    
    // Verify trip and client exist
    const trip = await Trip.findById(tripId).populate('clients.clientId', 'fullName');
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Find client in trip
    const clientData = trip.clients.find(c => c.clientId._id.toString() === clientId);
    if (!clientData) {
      return res.status(404).json({
        success: false,
        message: 'Client not found in this trip'
      });
    }
    
    // Check if adjustment exists
    if (!clientData.adjustment || clientData.adjustment === 0) {
      return res.status(400).json({
        success: false,
        message: 'No adjustment found for this client in this trip'
      });
    }
    
    // Get total paid so far
    const existingPayments = await AdjustmentPayment.find({ tripId, clientId });
    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Check if payment exceeds adjustment
    if (totalPaid + amount > Math.abs(clientData.adjustment)) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds pending adjustment. Pending: ₹${Math.abs(clientData.adjustment) - totalPaid}`
      });
    }
    
    const payment = await AdjustmentPayment.create({
      tripId,
      clientId,
      amount,
      paymentMode,
      paymentDate,
      remarks,
      createdBy: req.user._id
    });
    
    // Create activity log
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'adjustment_payment',
      description: `Added adjustment payment of ₹${amount} for ${clientData.clientId.fullName} in trip ${trip.tripNumber}`,
      metadata: {
        paymentId: payment._id,
        tripId: trip._id,
        tripNumber: trip.tripNumber,
        clientId: clientId,
        clientName: clientData.clientId.fullName,
        amount: amount,
        paymentMode: paymentMode
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Adjustment payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error creating adjustment payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get adjustment payments by trip and client
exports.getByTripAndClient = async (req, res) => {
  try {
    const { tripId, clientId } = req.params;
    
    const payments = await AdjustmentPayment.find({ tripId, clientId })
      .populate('createdBy', 'fullName email')
      .sort({ paymentDate: -1 });
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    res.json({
      success: true,
      data: payments,
      totalPaid
    });
  } catch (error) {
    console.error('Error fetching adjustment payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all adjustment payments for a client
exports.getByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const payments = await AdjustmentPayment.find({ clientId })
      .populate('tripId', 'tripNumber loadDate')
      .populate('createdBy', 'fullName email')
      .sort({ paymentDate: -1 });
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching client adjustment payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete adjustment payment
exports.deleteAdjustmentPayment = async (req, res) => {
  try {
    const payment = await AdjustmentPayment.findById(req.params.id)
      .populate('tripId', 'tripNumber')
      .populate('clientId', 'fullName');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Store info before deletion
    const paymentInfo = {
      amount: payment.amount,
      tripNumber: payment.tripId?.tripNumber,
      clientName: payment.clientId?.fullName,
      paymentMode: payment.paymentMode
    };
    
    await AdjustmentPayment.findByIdAndDelete(req.params.id);
    
    // Create activity log
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'adjustment_payment',
      description: `Deleted adjustment payment of ₹${paymentInfo.amount} for ${paymentInfo.clientName} in trip ${paymentInfo.tripNumber}`,
      metadata: {
        paymentId: req.params.id,
        tripNumber: paymentInfo.tripNumber,
        clientName: paymentInfo.clientName,
        amount: paymentInfo.amount,
        paymentMode: paymentInfo.paymentMode
      }
    });
    
    res.json({
      success: true,
      message: 'Adjustment payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting adjustment payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
