const mongoose = require('mongoose');
const Counter = require('./Counter');

const tripClientSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  originCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  destinationCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  loadDate: {
    type: Date,
    required: true
  },
  clientRate: {
    type: Number,
    required: true
  },
  truckHireCost: {
    type: Number,
    default: 0
  },
  adjustment: {
    type: Number,
    default: 0
  },
  packagingType: {
    type: String,
    enum: ['boxes', 'pallets', 'loose', 'container', 'other'],
    default: 'boxes'
  },
  specialInstructions: {
    type: String,
    trim: true
  }
}, { _id: false });

const tripSchema = new mongoose.Schema({
  tripNumber: {
    type: String,
    unique: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  tripDateTime: {
    type: Date,
    required: true
  },
  loadDate: {
    type: Date,
    required: true
  },
  
  // Multiple clients support
  clients: [tripClientSchema],
  
  // Overall trip details
  overallTripRate: {
    type: Number,
    default: 0
  },
  commissionType: {
    type: String,
    enum: ['from_fleet_owner', 'to_fleet_owner', 'none'],
    default: 'none'
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  podBalance: {
    type: Number,
    default: 0
  },
  actualPodAmt: {
    type: Number,
    default: 0
  },
  // POD submission history
  podHistory: [{
    submittedAmount: {
      type: Number,
      required: true
    },
    paymentType: {
      type: String,
      enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'rtgs', 'neft', 'imps'],
      default: 'cash'
    },
    notes: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    balanceBeforeSubmission: Number,
    balanceAfterSubmission: Number,
    advanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripAdvance',
      default: null
    }
  }],
  
  // Calculated fields
  totalClientRevenue: {
    type: Number,
    default: 0
  },
  totalCosts: {
    type: Number,
    default: 0
  },
  totalAdjustments: {
    type: Number,
    default: 0
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  
  // Trip status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  
  // Trip POD Status (overall trip POD status)
  trip_pod_status: {
    type: String,
    enum: ['trip_pod_pending', 'trip_pod_received', 'trip_pod_submitted', 'trip_pod_settled'],
    default: 'trip_pod_pending'
  },
  
  // Additional information
  additionalInstructions: {
    type: String,
    trim: true
  },
  
  // Timestamps
  startTime: Date,
  endTime: Date,
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate trip number and calculate profit before saving
tripSchema.pre('save', async function(next) {
  if (!this.tripNumber) {
    try {
      const seq = await Counter.getNextSequence('trip');
      this.tripNumber = `TRP${String(seq).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Populate vehicle to check ownership type
  await this.populate('vehicleId');
  
  const isFleetOwned = this.vehicleId?.ownershipType === 'fleet_owner';
  
  // Calculate totals
  this.totalClientRevenue = this.clients.reduce((sum, client) => sum + client.clientRate, 0);
  this.totalAdjustments = this.clients.reduce((sum, client) => sum + client.adjustment, 0);
  
  // Calculate profit based on ownership type
  if (isFleetOwned) {
    // Fleet-Owned Vehicle: Commission and POD applicable
    const commissionAmount = this.commissionAmount || 0;
    let commissionEffect = 0;
    
    if (this.commissionType === 'from_fleet_owner') {
      commissionEffect = commissionAmount; // ADD to profit
    } else if (this.commissionType === 'to_fleet_owner') {
      commissionEffect = -commissionAmount; // SUBTRACT from profit
    }
    
    // Fleet-Owned: Profit = Revenue - Hire Cost + Commission + POD (NO ADJUSTMENT)
    this.totalCosts = this.clients.reduce((sum, client) => sum + client.truckHireCost, 0);
    this.profitLoss = this.totalClientRevenue - this.totalCosts + commissionEffect + (this.podBalance || 0);
  } else {
    // Self-Owned Vehicle: Simple calculation
    // Profit = Revenue - Expenses - Advances
    // Only recalculate if not manually set (skip if profitLoss was modified directly)
    if (!this.isModified('profitLoss')) {
      this.totalCosts = 0;
      this.profitLoss = this.totalClientRevenue;
      
      // Reset commission and POD for self-owned vehicles
      this.commissionType = 'none';
      this.commissionAmount = 0;
      this.podBalance = 0;
    }
  }
  
  next();
});

// Indexes
tripSchema.index({ tripNumber: 1 });
tripSchema.index({ vehicleId: 1 });
tripSchema.index({ driverId: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ loadDate: -1 });
tripSchema.index({ isActive: 1 });

module.exports = mongoose.model('Trip', tripSchema);
