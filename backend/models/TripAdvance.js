const mongoose = require('mongoose');

const tripAdvanceSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  fleetOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FleetOwner',
    default: null
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'rtgs', 'neft', 'imps'],
    default: 'cash'
  },
  date: {
    type: Date,
    default: Date.now
  },
  advanceType: {
    type: String,
    enum: ['manual', 'pod_submission'],
    default: 'manual'
  },
  podHistoryId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
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
tripAdvanceSchema.index({ tripId: 1 });
tripAdvanceSchema.index({ fleetOwnerId: 1 });

module.exports = mongoose.model('TripAdvance', tripAdvanceSchema);
