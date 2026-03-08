const Vehicle = require('../models/Vehicle');

/**
 * @desc    Get all vehicles
 * @route   GET /api/vehicles
 * @access  Private
 */
exports.getAllVehicles = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (status) {
      query.currentStatus = status;
    }
    
    if (type) {
      query.vehicleType = type;
    }
    
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate('fleetOwnerId', 'fullName contact email')
      .populate('defaultDriverId', 'fullName contact')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single vehicle
 * @route   GET /api/vehicles/:id
 * @access  Private
 */
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('fleetOwnerId', 'fullName contact email')
      .populate('defaultDriverId', 'fullName contact');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create vehicle
 * @route   POST /api/vehicles
 * @access  Private (owner, manager)
 */
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    // Handle duplicate vehicle number
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private (owner, manager)
 */
exports.updateVehicle = async (req, res) => {
  try {
    // Get original data for logging
    const originalVehicle = await Vehicle.findById(req.params.id);
    
    if (!originalVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Store original data for activity log
    req.originalData = originalVehicle.toObject();

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('fleetOwnerId', 'fullName contact email')
     .populate('defaultDriverId', 'fullName contact');

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete vehicle (soft delete)
 * @route   DELETE /api/vehicles/:id
 * @access  Private (owner only)
 */
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Store deleted data for logging
    req.deletedData = {
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model
    };

    // Soft delete
    vehicle.isActive = false;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update vehicle status
 * @route   PATCH /api/vehicles/:id/status
 * @access  Private
 */
exports.updateVehicleStatus = async (req, res) => {
  try {
    const { currentStatus } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { currentStatus },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle status updated successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get vehicle statistics
 * @route   GET /api/vehicles/stats
 * @access  Private
 */
exports.getVehicleStats = async (req, res) => {
  try {
    const stats = await Vehicle.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Vehicle.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
