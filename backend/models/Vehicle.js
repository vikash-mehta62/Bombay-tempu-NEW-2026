const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Basic Details
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['truck', 'container', 'mini_truck', 'trailer', 'tanker', 'other'],
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  year: {
    type: Number
  },
  color: {
    type: String,
    trim: true
  },
  capacityTons: {
    type: Number,
    required: true
  },
  fuelType: {
    type: String,
    enum: ['diesel', 'petrol', 'cng', 'electric'],
    default: 'diesel'
  },
  
  // Ownership
  ownershipType: {
    type: String,
    enum: ['self_owned', 'fleet_owner'],
    required: true,
    default: 'self_owned'
  },
  fleetOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FleetOwner',
    default: null
  },
  
  // Identity
  engineNumber: {
    type: String,
    trim: true
  },
  chassisNumber: {
    type: String,
    trim: true
  },
  
  // Documents with Expiry
  registrationDate: Date,
  fitnessExpiryDate: Date,
  insuranceExpiryDate: Date,
  pucExpiryDate: Date,
  permitExpiryDate: Date,
  nationalPermitExpiryDate: Date,
  taxValidUptoDate: Date,
  
  // Loan Details
  hasLoan: {
    type: Boolean,
    default: false
  },
  loanDetails: {
    loanAmount: Number,
    emiAmount: Number,
    loanTenure: Number, // in months
    loanStartDate: Date,
    loanProvider: String,
    interestRate: Number,
    emiDueDate: Number, // day of month (1-31)
    elapsedMonths: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    remainingMonths: { type: Number, default: 0 },
    loanProgress: { type: Number, default: 0 }
  },
  
  // Status
  currentStatus: {
    type: String,
    enum: ['available', 'on_trip', 'maintenance', 'breakdown', 'sold'],
    default: 'available'
  },
  currentOdometer: {
    type: Number,
    default: 0
  },
  nextServiceKM: {
    type: Number,
    default: 0
  },
  
  // GPS Tracking
  gpsDeviceId: String,
  lastKnownLocation: String,
  lastLocationUpdate: Date,
  
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate loan details before saving
vehicleSchema.pre('save', function(next) {
  if (this.hasLoan && this.loanDetails.loanAmount && this.loanDetails.emiAmount && this.loanDetails.loanStartDate) {
    const startDate = new Date(this.loanDetails.loanStartDate);
    const currentDate = new Date();
    
    // Calculate elapsed months
    const monthsDiff = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (currentDate.getMonth() - startDate.getMonth());
    this.loanDetails.elapsedMonths = Math.max(0, monthsDiff);
    
    // Calculate total paid
    this.loanDetails.totalPaid = this.loanDetails.elapsedMonths * this.loanDetails.emiAmount;
    
    // Calculate remaining amount
    this.loanDetails.remainingAmount = Math.max(0, this.loanDetails.loanAmount - this.loanDetails.totalPaid);
    
    // Calculate remaining months
    this.loanDetails.remainingMonths = Math.max(0, this.loanDetails.loanTenure - this.loanDetails.elapsedMonths);
    
    // Calculate loan progress percentage
    this.loanDetails.loanProgress = Math.min(100, (this.loanDetails.totalPaid / this.loanDetails.loanAmount) * 100);
  }
  next();
});

// Indexes
vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ currentStatus: 1 });
vehicleSchema.index({ ownershipType: 1 });
vehicleSchema.index({ fleetOwnerId: 1 });
vehicleSchema.index({ isActive: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
