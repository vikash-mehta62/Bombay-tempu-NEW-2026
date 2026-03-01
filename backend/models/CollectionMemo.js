const mongoose = require('mongoose');

const collectionMemoSchema = new mongoose.Schema({
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
  collectionNumber: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  msName: {
    type: String,
    required: true
  },
  lorryNumber: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  rate: {
    type: String,
    required: true
  },
  freight: {
    type: String,
    required: true
  },
  advance: {
    type: String,
    required: true
  },
  balance: {
    type: String,
    required: true
  },
  weight: {
    type: String,
    required: true
  },
  guarantee: {
    type: String,
    default: ''
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
collectionMemoSchema.index({ tripId: 1 });
collectionMemoSchema.index({ clientId: 1 });

module.exports = mongoose.model('CollectionMemo', collectionMemoSchema);
