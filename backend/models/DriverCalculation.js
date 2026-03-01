const mongoose = require('mongoose');

const driverCalculationSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  tripIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  oldKM: {
    type: Number,
    required: true,
    default: 0
  },
  newKM: {
    type: Number,
    required: true,
    default: 0
  },
  perKMRate: {
    type: Number,
    required: true,
    default: 19.5
  },
  pichla: {
    type: Number,
    default: 0
  },
  totalKM: {
    type: Number,
    default: 0
  },
  kmValue: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  totalAdvances: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  due: {
    type: Number,
    default: 0
  },
  nextServiceKM: {
    type: Number,
    default: 0
  },
  originalTripData: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
driverCalculationSchema.index({ driverId: 1 });
driverCalculationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DriverCalculation', driverCalculationSchema);
