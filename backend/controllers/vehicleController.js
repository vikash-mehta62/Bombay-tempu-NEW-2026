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
    // Check if vehicle number already exists in active vehicles
    const existingVehicle = await Vehicle.findOne({ 
      vehicleNumber: req.body.vehicleNumber.toUpperCase(),
      isActive: true 
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number already exists'
      });
    }

    // Check if there's an inactive vehicle with same number - reactivate it
    const inactiveVehicle = await Vehicle.findOne({ 
      vehicleNumber: req.body.vehicleNumber.toUpperCase(),
      isActive: false 
    });

    if (inactiveVehicle) {
      // Update the inactive vehicle with new data
      Object.assign(inactiveVehicle, req.body);
      inactiveVehicle.isActive = true;
      await inactiveVehicle.save();

      return res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: inactiveVehicle
      });
    }

    // Create new vehicle
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

    // Check if vehicle number is being changed
    if (req.body.vehicleNumber && req.body.vehicleNumber.toUpperCase() !== originalVehicle.vehicleNumber) {
      // Check if new vehicle number already exists in active vehicles
      const existingVehicle = await Vehicle.findOne({ 
        vehicleNumber: req.body.vehicleNumber.toUpperCase(),
        isActive: true,
        _id: { $ne: req.params.id }
      });

      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle number already exists'
        });
      }
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

/**
 * @desc    Upload vehicle document
 * @route   POST /api/vehicles/:id/upload-document
 * @access  Private (admin only)
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const validDocTypes = [
      'registration',
      'fitness',
      'insurance',
      'puc',
      'permit',
      'national-permit',
      'tax'
    ];
    
    if (!validDocTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }
    
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    // Upload to Cloudinary
    const cloudinary = require('cloudinary').v2;
    
    // Convert buffer to base64
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Map document type to field name
    const fieldMap = {
      'registration': 'registrationDocument',
      'fitness': 'fitnessDocument',
      'insurance': 'insuranceDocument',
      'puc': 'pucDocument',
      'permit': 'permitDocument',
      'national-permit': 'nationalPermitDocument',
      'tax': 'taxDocument'
    };
    
    const fieldName = fieldMap[documentType];
    
    // Delete old document if exists
    if (vehicle[fieldName]?.publicId) {
      await cloudinary.uploader.destroy(vehicle[fieldName].publicId);
    }
    
    // Upload new document
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: `vehicles/${vehicle._id}/${documentType}`,
      resource_type: 'image'
    });
    
    // Update vehicle document
    vehicle[fieldName] = {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      uploadedAt: new Date()
    };
    
    await vehicle.save();
    
    res.json({
      success: true,
      message: `${documentType} document uploaded successfully`,
      data: {
        url: uploadResponse.secure_url,
        documentType
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

/**
 * @desc    Upload vehicle document
 * @route   POST /api/vehicles/:id/upload-document
 * @access  Private (admin only)
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;
    
    const validDocTypes = [
      'registration',
      'registrationFront',
      'registrationBack',
      'fitness',
      'insurance',
      'puc',
      'permit',
      'nationalPermit',
      'tax',
      'aadharFront',
      'aadharBack',
      'pan',
      'tds'
    ];
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    if (!validDocTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid document type. Valid types: ${validDocTypes.join(', ')}`
      });
    }
    
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    // Upload to Cloudinary
    const cloudinary = require('cloudinary').v2;
    
    // Convert buffer to base64
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Map document type to actual model field name
    const fieldMap = {
      'registration': 'registrationDocument',
      'registrationFront': 'registrationDocumentFront',
      'registrationBack': 'registrationDocumentBack',
      'fitness': 'fitnessDocument',
      'insurance': 'insuranceDocument',
      'puc': 'pucDocument',
      'permit': 'permitDocument',
      'nationalPermit': 'nationalPermitDocument',
      'tax': 'taxDocument',
      'aadharFront': 'aadharCardFront',
      'aadharBack': 'aadharCardBack',
      'pan': 'panCard',
      'tds': 'tdsForm'
    };
    
    const docField = fieldMap[documentType];
    
    // Delete old document if exists
    if (vehicle[docField]?.publicId) {
      await cloudinary.uploader.destroy(vehicle[docField].publicId);
    }
    
    // Upload new document
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: `vehicles/${vehicle._id}/${documentType}`,
      resource_type: 'image'
    });
    
    // Update vehicle document
    vehicle[docField] = {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      uploadedAt: new Date()
    };
    
    await vehicle.save();
    
    res.json({
      success: true,
      message: `${documentType} document uploaded successfully`,
      data: {
        url: uploadResponse.secure_url,
        documentType
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

/**
 * @desc    Delete vehicle document
 * @route   DELETE /api/vehicles/:id/delete-document/:documentType
 * @access  Private (admin only)
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id, documentType } = req.params;
    
    const validDocTypes = [
      'registration',
      'registrationFront',
      'registrationBack',
      'fitness',
      'insurance',
      'puc',
      'permit',
      'nationalPermit',
      'tax',
      'aadharFront',
      'aadharBack',
      'pan',
      'tds'
    ];
    
    if (!validDocTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }
    
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    const cloudinary = require('cloudinary').v2;
    
    // Map document type to actual model field name
    const fieldMap = {
      'registration': 'registrationDocument',
      'registrationFront': 'registrationDocumentFront',
      'registrationBack': 'registrationDocumentBack',
      'fitness': 'fitnessDocument',
      'insurance': 'insuranceDocument',
      'puc': 'pucDocument',
      'permit': 'permitDocument',
      'nationalPermit': 'nationalPermitDocument',
      'tax': 'taxDocument',
      'aadharFront': 'aadharCardFront',
      'aadharBack': 'aadharCardBack',
      'pan': 'panCard',
      'tds': 'tdsForm'
    };
    
    const docField = fieldMap[documentType];
    
    // Delete from Cloudinary
    if (vehicle[docField]?.publicId) {
      await cloudinary.uploader.destroy(vehicle[docField].publicId);
      vehicle[docField] = undefined;
    }
    
    await vehicle.save();
    
    res.json({
      success: true,
      message: `${documentType} document deleted successfully`
    });
  } catch (error) {
    console.error('Document delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};
