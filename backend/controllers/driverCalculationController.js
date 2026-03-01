const DriverCalculation = require('../models/DriverCalculation');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const { createActivityLog } = require('../utils/activityLogger');

// Create driver calculation
exports.createCalculation = async (req, res) => {
  try {
    const calculationData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const calculation = await DriverCalculation.create(calculationData);
    
    // Get driver info for log
    const driver = await Driver.findById(req.body.driverId);
    
    // Update vehicle's nextServiceKM if provided
    if (req.body.vehicleId && req.body.nextServiceKM) {
      await Vehicle.findByIdAndUpdate(req.body.vehicleId, {
        nextServiceKM: req.body.nextServiceKM,
        currentOdometer: req.body.newKM
      });
    }
    
    // Create activity log
    await createActivityLog({
      user: req.user,
      action: `Created driver calculation for ${driver?.fullName || 'Unknown'} - ${req.body.tripIds?.length || 0} trips`,
      actionType: 'CREATE',
      module: 'trips',
      entityId: calculation._id,
      entityType: 'DriverCalculation',
      details: {
        calculationId: calculation._id,
        driverId: req.body.driverId,
        driverName: driver?.fullName,
        tripCount: req.body.tripIds?.length || 0,
        totalKM: req.body.totalKM,
        due: req.body.due
      },
      req
    });
    
    res.status(201).json({
      success: true,
      message: 'Calculation created successfully',
      data: calculation
    });
  } catch (error) {
    console.error('Error creating calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get calculations by driver
exports.getByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const calculations = await DriverCalculation.find({ driverId })
      .populate('driverId', 'fullName contact')
      .populate('tripIds', 'tripNumber loadDate')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: calculations
    });
  } catch (error) {
    console.error('Error fetching calculations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get calculation by ID
exports.getById = async (req, res) => {
  try {
    const calculation = await DriverCalculation.findById(req.params.id)
      .populate('driverId', 'fullName contact')
      .populate('tripIds', 'tripNumber loadDate')
      .populate('createdBy', 'fullName email');
    
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Calculation not found'
      });
    }
    
    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    console.error('Error fetching calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update calculation
exports.updateCalculation = async (req, res) => {
  try {
    const calculation = await DriverCalculation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('driverId', 'fullName contact');
    
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Calculation not found'
      });
    }
    
    // Create activity log
    await createActivityLog({
      user: req.user,
      action: `Updated driver calculation for ${calculation.driverId?.fullName || 'Unknown'}`,
      actionType: 'UPDATE',
      module: 'trips',
      entityId: calculation._id,
      entityType: 'DriverCalculation',
      details: {
        calculationId: calculation._id,
        driverId: calculation.driverId?._id,
        driverName: calculation.driverId?.fullName
      },
      req
    });
    
    res.json({
      success: true,
      message: 'Calculation updated successfully',
      data: calculation
    });
  } catch (error) {
    console.error('Error updating calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete calculation
exports.deleteCalculation = async (req, res) => {
  try {
    const calculation = await DriverCalculation.findById(req.params.id)
      .populate('driverId', 'fullName');
    
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Calculation not found'
      });
    }
    
    const driverName = calculation.driverId?.fullName;
    
    await DriverCalculation.findByIdAndDelete(req.params.id);
    
    // Create activity log
    await createActivityLog({
      user: req.user,
      action: `Deleted driver calculation for ${driverName || 'Unknown'}`,
      actionType: 'DELETE',
      module: 'trips',
      entityId: req.params.id,
      entityType: 'DriverCalculation',
      details: {
        calculationId: req.params.id,
        driverName: driverName
      },
      req
    });
    
    res.json({
      success: true,
      message: 'Calculation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
