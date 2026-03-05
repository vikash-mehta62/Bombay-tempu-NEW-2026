const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const fleetOwnerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  
  // Login credentials
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    default: '12345678',
    select: false
  },
  
  // Business Details
  companyName: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true
  },
  panNumber: {
    type: String,
    trim: true
  },
  
  // Bank Details
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Stats
  totalVehicles: {
    type: Number,
    default: 0
  },
  
  notes: String
}, {
  timestamps: true
});

// Hash password before saving
fleetOwnerSchema.pre('save', async function(next) {
  // If password is not set, use default
  if (!this.password) {
    this.password = '12345678';
  }
  
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare password
fleetOwnerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
fleetOwnerSchema.index({ contact: 1 });
fleetOwnerSchema.index({ username: 1 });
fleetOwnerSchema.index({ isActive: 1 });

module.exports = mongoose.model('FleetOwner', fleetOwnerSchema);
