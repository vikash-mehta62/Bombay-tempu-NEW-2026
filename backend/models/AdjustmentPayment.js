const mongoose = require('mongoose');

const adjustmentPaymentSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'cheque', 'online', 'upi'],
    default: 'cash'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
adjustmentPaymentSchema.index({ tripId: 1, clientId: 1 });
adjustmentPaymentSchema.index({ clientId: 1 });

module.exports = mongoose.model('AdjustmentPayment', adjustmentPaymentSchema);
