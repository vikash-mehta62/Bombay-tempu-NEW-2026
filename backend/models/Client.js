const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  companyName: {
    type: String,
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
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true
  },
  password: {
    type: String,
    select: false // Don't return password by default
  },
  billingAddress: {
    type: String,
    trim: true
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  clientType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
clientSchema.pre('save', async function(next) {
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
clientSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
clientSchema.index({ contact: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ gstNumber: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ isActive: 1 });

module.exports = mongoose.model('Client', clientSchema);
