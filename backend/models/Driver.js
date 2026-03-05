const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  address: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  licenseExpiry: {
    type: Date
  },
  licenseDocument: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  aadhaarNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  aadhaarFrontDocument: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  aadhaarBackDocument: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  dateOfBirth: {
    type: Date
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  password: {
    type: String,
    select: false // Don't return password by default
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  status: {
    type: String,
    enum: ['available', 'on_trip', 'on_leave', 'inactive', 'terminated'],
    default: 'available'
  },
  currentVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
driverSchema.pre('save', async function(next) {
  // If password is not set, use default
  if (!this.password) {
    this.password = '12345678';
  }
  
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
driverSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
driverSchema.index({ contact: 1 });
driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ status: 1 });
driverSchema.index({ isActive: 1 });

module.exports = mongoose.model('Driver', driverSchema);
