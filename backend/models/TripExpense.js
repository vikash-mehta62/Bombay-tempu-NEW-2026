const mongoose = require('mongoose');

const tripExpenseSchema = new mongoose.Schema({
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
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  expenseType: {
    type: String,
    enum: ['fuel', 'toll', 'loading', 'unloading', 'maintenance', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  additionalNotes: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  date: {
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
tripExpenseSchema.index({ tripId: 1 });
tripExpenseSchema.index({ fleetOwnerId: 1 });
tripExpenseSchema.index({ vehicleId: 1 });

module.exports = mongoose.model('TripExpense', tripExpenseSchema);
