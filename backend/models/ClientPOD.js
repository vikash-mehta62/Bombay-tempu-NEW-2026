const mongoose = require('mongoose');

const clientPODSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pod_pending', 'pod_received', 'pod_submitted', 'settled'],
    default: 'pod_pending'
  },
  // Array of documents - each status can have multiple documents
  documents: [{
    documentUrl: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pod_pending', 'pod_received', 'pod_submitted', 'settled'],
      required: true
    },
    notes: {
      type: String
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Legacy field - kept for backward compatibility
  documentUrl: {
    type: String
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
clientPODSchema.index({ tripId: 1, clientId: 1 });

module.exports = mongoose.model('ClientPOD', clientPODSchema);
