const mongoose = require('mongoose');

const balanceMemoSchema = new mongoose.Schema({
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
  invoiceNumber: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  freight: {
    type: Number,
    required: true
  },
  advance: {
    type: Number,
    required: true
  },
  detention: {
    type: Number,
    default: 0
  },
  unloadingCharge: {
    type: Number,
    default: 0
  },
  totalPayable: {
    type: Number,
    required: true
  },
  remarks: {
    type: String,
    default: ''
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
balanceMemoSchema.index({ tripId: 1 });
balanceMemoSchema.index({ clientId: 1 });

module.exports = mongoose.model('BalanceMemo', balanceMemoSchema);
