const mongoose = require('mongoose');
const companyPlugin = require('../utils/companyPlugin');

const billSchema = new mongoose.Schema({
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
  billNo: {
    type: String,
    required: true,
    trim: true
  },
  billDate: {
    type: Date,
    required: true
  },
  invoiceTitle: {
    type: String,
    default: 'TAX INVOICE',
    trim: true
  },
  sacCode: {
    type: String,
    default: '996791',
    trim: true
  },
  lrNo: {
    type: String,
    trim: true
  },
  ewayBillNo: {
    type: String,
    trim: true
  },
  baCode: {
    type: String,
    trim: true
  },
  cinNo: {
    type: String,
    trim: true
  },
  customerGstin: {
    type: String,
    trim: true
  },
  stateOfSupply: {
    type: String,
    trim: true
  },
  stateCode: {
    type: String,
    trim: true
  },
  lrDate: {
    type: Date,
    default: null
  },
  unloadingDate: {
    type: Date,
    default: null
  },
  vehicleType: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  invoiceNo: {
    type: String,
    trim: true
  },
  packageQty: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    default: 0
  },
  rate: {
    type: Number,
    default: 0
  },
  consignor: {
    type: String,
    trim: true
  },
  consignee: {
    type: String,
    trim: true
  },
  freightAmount: {
    type: Number,
    default: 0
  },
  loadingCharges: {
    type: Number,
    default: 0
  },
  unloadingCharges: {
    type: Number,
    default: 0
  },
  detentionCharges: {
    type: Number,
    default: 0
  },
  otherCharges: {
    type: Number,
    default: 0
  },
  cgstPercent: {
    type: Number,
    default: 0
  },
  sgstPercent: {
    type: Number,
    default: 0
  },
  igstPercent: {
    type: Number,
    default: 0
  },
  advanceReceived: {
    type: Number,
    default: 0
  },
  taxableAmount: {
    type: Number,
    default: 0
  },
  cgstAmount: {
    type: Number,
    default: 0
  },
  sgstAmount: {
    type: Number,
    default: 0
  },
  igstAmount: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    default: 0
  },
  balancePayable: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
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

billSchema.index({ tripId: 1, clientId: 1, isActive: 1 });
billSchema.index(
  { tripId: 1, clientId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
billSchema.index({ billNo: 1 });
billSchema.plugin(companyPlugin);

module.exports = mongoose.model('Bill', billSchema);
