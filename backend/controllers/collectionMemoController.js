const CollectionMemo = require('../models/CollectionMemo');
const Trip = require('../models/Trip');
const Client = require('../models/Client');
const { createActivityLog } = require('../utils/activityLogger');

// Create collection memo
const createMemo = async (req, res) => {
  try {
    const { tripId, clientId, ...memoData } = req.body;

    // Verify trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const memo = await CollectionMemo.create({
      tripId,
      clientId,
      ...memoData,
      createdBy: req.user._id
    });

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Created collection memo ${memoData.collectionNumber} for ${client.fullName} in trip ${trip.tripNumber}`,
      actionType: 'CREATE',
      module: 'trips',
      entityId: memo._id,
      entityType: 'CollectionMemo',
      details: {
        tripId,
        tripNumber: trip.tripNumber,
        clientId,
        clientName: client.fullName,
        collectionNumber: memoData.collectionNumber,
        freight: memoData.freight,
        balance: memoData.balance
      },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Collection memo created successfully',
      data: memo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get memos by trip
const getMemosByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const memos = await CollectionMemo.find({ 
      tripId,
      isActive: true 
    })
    .populate('clientId', 'fullName companyName')
    .populate('createdBy', 'fullName username')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: memos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get memo by ID
const getMemoById = async (req, res) => {
  try {
    const memo = await CollectionMemo.findById(req.params.id)
      .populate('clientId', 'fullName companyName')
      .populate('tripId', 'tripNumber')
      .populate('createdBy', 'fullName username');

    if (!memo) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }

    res.json({
      success: true,
      data: memo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete memo
const deleteMemo = async (req, res) => {
  try {
    const memo = await CollectionMemo.findById(req.params.id)
      .populate('tripId', 'tripNumber')
      .populate('clientId', 'fullName');
    
    if (!memo) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }

    memo.isActive = false;
    await memo.save();

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Deleted collection memo ${memo.collectionNumber} for ${memo.clientId.fullName}`,
      actionType: 'DELETE',
      module: 'trips',
      entityId: memo._id,
      entityType: 'CollectionMemo',
      details: {
        tripId: memo.tripId._id,
        tripNumber: memo.tripId.tripNumber,
        clientId: memo.clientId._id,
        clientName: memo.clientId.fullName,
        collectionNumber: memo.collectionNumber
      },
      req
    });

    res.json({
      success: true,
      message: 'Memo deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update memo
const updateMemo = async (req, res) => {
  try {
    const { tripId, clientId, ...memoData } = req.body;

    const memo = await CollectionMemo.findById(req.params.id)
      .populate('tripId', 'tripNumber')
      .populate('clientId', 'fullName');
      
    if (!memo) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }

    const oldData = { ...memo.toObject() };

    // Update memo fields
    Object.assign(memo, memoData);
    if (tripId) memo.tripId = tripId;
    if (clientId) memo.clientId = clientId;

    await memo.save();

    // Log activity
    await createActivityLog({
      user: req.user,
      action: `Updated collection memo ${memo.collectionNumber} for ${memo.clientId.fullName}`,
      actionType: 'UPDATE',
      module: 'trips',
      entityId: memo._id,
      entityType: 'CollectionMemo',
      details: {
        tripId: memo.tripId._id,
        tripNumber: memo.tripId.tripNumber,
        clientId: memo.clientId._id,
        clientName: memo.clientId.fullName,
        collectionNumber: memo.collectionNumber
      },
      changes: {
        before: oldData,
        after: memo.toObject()
      },
      req
    });

    res.json({
      success: true,
      message: 'Collection memo updated successfully',
      data: memo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMemo,
  updateMemo,
  getMemosByTrip,
  getMemoById,
  deleteMemo
};
