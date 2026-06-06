const mongoose = require('mongoose');

const lrSchema = new mongoose.Schema({
  // Company Info
  companyName: { type: String, default: 'MK LOGISTICS' },
  officeAddress: { type: String },
  mob: { type: String },
  gstNo: { type: String },
  
  // Booking Type
  bookingType: { type: String, enum: ['TO PAY', 'PAID', 'TBB', 'BOD'], default: 'TO PAY' },
  deliveryType: { type: String, enum: ['GODOWN TO GODOWN', 'FOC'], default: 'GODOWN TO GODOWN' },
  serviceType: { type: String, enum: ['ROAD', 'TRAIN', 'AIR', 'EXPRESS'], default: 'ROAD' },
  issueType: { type: String, enum: ['ISSUE', 'TRANSFER', 'COLLECTION', 'RETURN'], default: 'ISSUE' },
  
  // Consignor Details
  consignorName: { type: String },
  consignorAddress: { type: String },
  consignorPin: { type: String },
  consignorMob: { type: String },
  consignorGst: { type: String },
  consignorCode: { type: String },
  
  // Consignee Details
  consigneeName: { type: String },
  consigneeAddress: { type: String },
  consigneePin: { type: String },
  consigneeMob: { type: String },
  consigneeGst: { type: String },
  consigneeCode: { type: String },
  
  // Consignment Details
  consignmentNo: { type: String, required: true, unique: true },
  customerName: { type: String },
  from: { type: String },
  to: { type: String },
  
  // Items
  items: [{
    typeOfPacking: String,
    description: String,
    actualWeight: String,
    chargedWeight: String,
    rate: String
  }],
  
  // Dimensions
  noOfPackages: { type: String },
  length: { type: String },
  width: { type: String },
  height: { type: String },
  privateMarks: { type: String },
  declaredValue: { type: String },
  
  // Invoices
  invoices: [{
    invoiceNo: String,
    date: String,
    partName: String,
    partNo: String,
    noOfPcs: String,
    ewayBillNo: String
  }],
  
  // Charges
  freight: { type: String, default: '0' },
  rov: { type: String, default: '0' },
  fodToPay: { type: String, default: '0' },
  fuelSurcharge: { type: String, default: '0' },
  collection: { type: String, default: '0' },
  delCharges: { type: String, default: '0' },
  hamali: { type: String, default: '0' },
  builtyCharges: { type: String, default: '200' },
  sgstPercent: { type: String, default: '0' },
  cgstPercent: { type: String, default: '0' },
  igstPercent: { type: String, default: '0' },
  
  // RPE Details
  rpeType: { type: String },
  rpeId: { type: String },
  rpeQty: { type: String },
  rpeRemarks: { type: String },
  
  // Footer
  lrNo: { type: String },
  grnNo: { type: String },
  grnDate: { type: String },
  specialInstruction: { type: String },
  preparedBy: { type: String, default: 'MOHIT KAREL' },
  amountInWords: { type: String },

  // Invoice/Bill Document Upload
  invoiceDocument: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  billDocument: {
    url: String,
    publicId: String,
    uploadedAt: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LR', lrSchema);
