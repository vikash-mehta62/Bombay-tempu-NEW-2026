const Driver = require('../models/Driver');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbtkldfa4',
  api_key: process.env.CLOUDINARY_API_KEY || '747527783338524',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YCPSLXMO0OYfwrUYNOYa_Xip_eo'
};

cloudinary.config(cloudinaryConfig);

// Get all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const drivers = await Driver.find(query)
      .populate('currentVehicle', 'vehicleNumber vehicleType')
      .sort({ createdAt: -1 })
      .select('-password');
    
    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get driver by ID
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('currentVehicle')
      .select('-password');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new driver
exports.createDriver = async (req, res) => {
  try {
    // If licenseNumber is empty string, set it to undefined to avoid unique constraint issues
    if (req.body.licenseNumber === '' || req.body.licenseNumber === null) {
      delete req.body.licenseNumber;
    }
    
    // If aadhaarNumber is empty string, set it to undefined
    if (req.body.aadhaarNumber === '' || req.body.aadhaarNumber === null) {
      delete req.body.aadhaarNumber;
    }
    
    // If email is empty string, set it to undefined
    if (req.body.email === '' || req.body.email === null) {
      delete req.body.email;
    }
    
    const driver = new Driver(req.body);
    await driver.save();
    
    const driverData = driver.toObject();
    delete driverData.password;
    
    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driverData
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update driver
exports.updateDriver = async (req, res) => {
  try {
    // Don't allow password update through this endpoint
    delete req.body.password;
    
    // Convert empty strings to null for optional unique fields
    if (req.body.licenseNumber === '') {
      req.body.licenseNumber = null;
    }
    if (req.body.aadhaarNumber === '') {
      req.body.aadhaarNumber = null;
    }
    if (req.body.email === '') {
      req.body.email = null;
    }
    
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Driver updated successfully',
      data: driver
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete driver (soft delete)
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'terminated' },
      { new: true }
    ).select('-password');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Driver deleted successfully',
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get driver statistics
exports.getDriverStats = async (req, res) => {
  try {
    const stats = await Driver.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await Driver.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: {
        total,
        byStatus: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Upload driver document (License or Aadhaar)
exports.uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body; // 'license', 'aadhaar-front', or 'aadhaar-back'
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    if (!['license', 'aadhaar-front', 'aadhaar-back'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Use "license", "aadhaar-front", or "aadhaar-back"'
      });
    }
    
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Upload to Cloudinary
    const cloudinary = require('cloudinary').v2;
    
    // Convert buffer to base64
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Delete old document if exists
    if (documentType === 'license' && driver.licenseDocument?.publicId) {
      await cloudinary.uploader.destroy(driver.licenseDocument.publicId);
    } else if (documentType === 'aadhaar-front' && driver.aadhaarFrontDocument?.publicId) {
      await cloudinary.uploader.destroy(driver.aadhaarFrontDocument.publicId);
    } else if (documentType === 'aadhaar-back' && driver.aadhaarBackDocument?.publicId) {
      await cloudinary.uploader.destroy(driver.aadhaarBackDocument.publicId);
    }
    
    // Upload new document
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: `drivers/${driver._id}/${documentType}`,
      resource_type: 'image'
    });
    
    // Update driver document
    if (documentType === 'license') {
      driver.licenseDocument = {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        uploadedAt: new Date()
      };
    } else if (documentType === 'aadhaar-front') {
      driver.aadhaarFrontDocument = {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        uploadedAt: new Date()
      };
    } else if (documentType === 'aadhaar-back') {
      driver.aadhaarBackDocument = {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        uploadedAt: new Date()
      };
    }
    
    await driver.save();
    
    res.json({
      success: true,
      message: `${documentType === 'license' ? 'License' : documentType === 'aadhaar-front' ? 'Aadhaar Front' : 'Aadhaar Back'} document uploaded successfully`,
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

// Delete driver document
exports.deleteDocument = async (req, res) => {
  try {
    const { id, documentType } = req.params;
    
    if (!['license', 'aadhaar-front', 'aadhaar-back'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }
    
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    const cloudinary = require('cloudinary').v2;
    
    // Delete from Cloudinary
    if (documentType === 'license' && driver.licenseDocument?.publicId) {
      await cloudinary.uploader.destroy(driver.licenseDocument.publicId);
      driver.licenseDocument = undefined;
    } else if (documentType === 'aadhaar-front' && driver.aadhaarFrontDocument?.publicId) {
      await cloudinary.uploader.destroy(driver.aadhaarFrontDocument.publicId);
      driver.aadhaarFrontDocument = undefined;
    } else if (documentType === 'aadhaar-back' && driver.aadhaarBackDocument?.publicId) {
      await cloudinary.uploader.destroy(driver.aadhaarBackDocument.publicId);
      driver.aadhaarBackDocument = undefined;
    }
    
    await driver.save();
    
    res.json({
      success: true,
      message: `${documentType === 'license' ? 'License' : documentType === 'aadhaar-front' ? 'Aadhaar Front' : 'Aadhaar Back'} document deleted successfully`
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
