const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  expenseType: {
    type: String,
    required: true,
    enum: ['vehicle', 'office', 'staff_room', 'room', 'gopiram', 'mohit', 'bills', 'other']
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
expenseSchema.index({ expenseType: 1 });
expenseSchema.index({ vehicleId: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ isActive: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
