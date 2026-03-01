const mongoose = require('mongoose');

const clientPaymentSchema = new mongoose.Schema({
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
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'rtgs', 'neft', 'imps'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    default: 'General'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
clientPaymentSchema.index({ tripId: 1 });
clientPaymentSchema.index({ clientId: 1 });

module.exports = mongoose.model('ClientPayment', clientPaymentSchema);
