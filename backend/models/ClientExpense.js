const mongoose = require('mongoose');

const clientExpenseSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true
  },
  paidBy: {
    type: String,
    enum: ['driver', 'admin', 'self', 'client'],
    default: 'self'
  },
  expenseType: {
    type: String,
    default: 'Other'
  },
  description: {
    type: String,
    trim: true
  },
  paymentDate: {
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
clientExpenseSchema.index({ tripId: 1 });
clientExpenseSchema.index({ clientId: 1 });

module.exports = mongoose.model('ClientExpense', clientExpenseSchema);
