const Bill = require('../models/Bill');
const Trip = require('../models/Trip');
const Client = require('../models/Client');
const { createActivityLog } = require('../utils/activityLogger');

const toNumber = (value) => Number(value || 0);

const buildBillPayload = (data) => {
  const freightAmount = toNumber(data.freightAmount);
  const loadingCharges = toNumber(data.loadingCharges);
  const unloadingCharges = toNumber(data.unloadingCharges);
  const detentionCharges = toNumber(data.detentionCharges);
  const otherCharges = toNumber(data.otherCharges);
  const cgstPercent = toNumber(data.cgstPercent);
  const sgstPercent = toNumber(data.sgstPercent);
  const igstPercent = toNumber(data.igstPercent);
  const advanceReceived = toNumber(data.advanceReceived);
  const packageQty = toNumber(data.packageQty);
  const weight = toNumber(data.weight);
  const rate = toNumber(data.rate);

  const taxableAmount = freightAmount + loadingCharges + unloadingCharges + otherCharges;
  const cgstAmount = (taxableAmount * cgstPercent) / 100;
  const sgstAmount = (taxableAmount * sgstPercent) / 100;
  const igstAmount = (taxableAmount * igstPercent) / 100;
  const grandTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;
  const balancePayable = grandTotal - advanceReceived;

  return {
    billNo: data.billNo,
    billDate: data.billDate,
    invoiceTitle: data.invoiceTitle || 'TAX INVOICE',
    sacCode: data.sacCode || '996791',
    lrNo: data.lrNo || '',
    ewayBillNo: data.ewayBillNo || '',
    baCode: data.baCode || '',
    cinNo: data.cinNo || '',
    customerGstin: data.customerGstin || '',
    stateOfSupply: data.stateOfSupply || '',
    stateCode: data.stateCode || '',
    lrDate: data.lrDate || null,
    unloadingDate: data.unloadingDate || null,
    vehicleType: data.vehicleType || '',
    vendor: data.vendor || '',
    invoiceNo: data.invoiceNo || '',
    packageQty,
    weight,
    rate,
    consignor: data.consignor || '',
    consignee: data.consignee || '',
    freightAmount,
    loadingCharges,
    unloadingCharges,
    detentionCharges,
    otherCharges,
    cgstPercent,
    sgstPercent,
    igstPercent,
    advanceReceived,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    grandTotal,
    balancePayable,
    remarks: data.remarks || ''
  };
};

const populateBill = (query) => query
  .populate('clientId', 'fullName companyName contact address billingAddress gstNumber')
  .populate({
    path: 'tripId',
    select: 'tripNumber loadDate vehicleId clients',
    populate: [
      { path: 'vehicleId', select: 'vehicleNumber' },
      { path: 'clients.originCity', select: 'cityName state pincode' },
      { path: 'clients.destinationCity', select: 'cityName state pincode' },
      { path: 'clients.clientId', select: 'fullName companyName contact' }
    ]
  })
  .populate('createdBy', 'fullName username')
  .populate('updatedBy', 'fullName username');

const verifyTripClient = async (tripId, clientId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return { error: 'Trip not found' };

  const tripClientExists = trip.clients?.some((client) => client.clientId.toString() === clientId);
  if (!tripClientExists) return { error: 'Client is not linked with this trip' };

  const client = await Client.findById(clientId);
  if (!client) return { error: 'Client not found' };

  return { trip, client };
};

const saveBill = async (req, res) => {
  try {
    const { tripId, clientId, ...billData } = req.body;

    if (!tripId || !clientId) {
      return res.status(400).json({ success: false, message: 'Trip and client are required' });
    }

    if (!billData.billNo || !billData.billDate) {
      return res.status(400).json({ success: false, message: 'Bill number and bill date are required' });
    }

    const { trip, client, error } = await verifyTripClient(tripId, clientId);
    if (error) {
      return res.status(error === 'Client is not linked with this trip' ? 400 : 404).json({ success: false, message: error });
    }

    const payload = buildBillPayload(billData);
    let bill = await Bill.findOne({ tripId, clientId, isActive: true });
    const isNew = !bill;

    if (bill) {
      Object.assign(bill, payload, { updatedBy: req.user?._id || null });
      await bill.save();
    } else {
      bill = await Bill.create({
        tripId,
        clientId,
        ...payload,
        createdBy: req.user?._id || null,
        updatedBy: req.user?._id || null
      });
    }

    await createActivityLog({
      user: req.user,
      action: `${isNew ? 'Created' : 'Updated'} bill ${bill.billNo} for ${client.companyName || client.fullName} in trip ${trip.tripNumber}`,
      actionType: isNew ? 'CREATE' : 'UPDATE',
      module: 'trips',
      entityId: bill._id,
      entityType: 'Bill',
      details: {
        tripId,
        tripNumber: trip.tripNumber,
        clientId,
        clientName: client.companyName || client.fullName,
        billNo: bill.billNo,
        grandTotal: bill.grandTotal,
        balancePayable: bill.balancePayable
      },
      req
    });

    bill = await populateBill(Bill.findById(bill._id));

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Bill saved successfully' : 'Bill updated successfully',
      data: bill
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBillByTripAndClient = async (req, res) => {
  try {
    const { tripId, clientId } = req.params;
    const bill = await populateBill(Bill.findOne({ tripId, clientId, isActive: true }));

    res.json({
      success: true,
      data: bill || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBillsByTrip = async (req, res) => {
  try {
    const bills = await populateBill(
      Bill.find({ tripId: req.params.tripId, isActive: true }).sort({ updatedAt: -1 })
    );

    res.json({
      success: true,
      data: bills
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllBills = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { billNo: { $regex: search, $options: 'i' } },
        { consignor: { $regex: search, $options: 'i' } },
        { consignee: { $regex: search, $options: 'i' } }
      ];
    }

    const bills = await populateBill(
      Bill.find(query)
        .sort({ updatedAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
    );
    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      data: bills,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBills: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    bill.isActive = false;
    bill.updatedBy = req.user?._id || null;
    await bill.save();

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  saveBill,
  getAllBills,
  getBillByTripAndClient,
  getBillsByTrip,
  deleteBill
};
