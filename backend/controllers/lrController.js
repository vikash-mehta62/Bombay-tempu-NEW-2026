const LR = require('../models/LR');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbtkldfa4',
  api_key: process.env.CLOUDINARY_API_KEY || '747527783338524',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YCPSLXMO0OYfwrUYNOYa_Xip_eo'
};

cloudinary.config(cloudinaryConfig);

// Create new LR
exports.createLR = async (req, res) => {
  try {
    const { consignmentNo } = req.body;

    // Check if consignment number already exists
    const existingLR = await LR.findOne({ consignmentNo });
    if (existingLR) {
      return res.status(400).json({ message: 'Consignment number already exists' });
    }

    const lr = new LR(req.body);
    await lr.save();

    res.status(201).json({
      message: 'LR created successfully',
      lr
    });
  } catch (error) {
    console.error('Create LR error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all LRs
exports.getAllLRs = async (req, res) => {
  try {
    const lrs = await LR.find().sort({ createdAt: -1 });
    res.json(lrs);
  } catch (error) {
    console.error('Get all LRs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single LR by ID
exports.getLRById = async (req, res) => {
  try {
    const lr = await LR.findById(req.params.id);
    if (!lr) {
      return res.status(404).json({ message: 'LR not found' });
    }
    res.json(lr);
  } catch (error) {
    console.error('Get LR by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update LR
exports.updateLR = async (req, res) => {
  try {
    const { consignmentNo } = req.body;
    const lrId = req.params.id;

    // Check if consignment number is being changed and if it already exists
    if (consignmentNo) {
      const existingLR = await LR.findOne({ 
        consignmentNo, 
        _id: { $ne: lrId } 
      });
      if (existingLR) {
        return res.status(400).json({ message: 'Consignment number already exists' });
      }
    }

    const lr = await LR.findByIdAndUpdate(
      lrId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!lr) {
      return res.status(404).json({ message: 'LR not found' });
    }

    res.json({
      message: 'LR updated successfully',
      lr
    });
  } catch (error) {
    console.error('Update LR error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete LR
exports.deleteLR = async (req, res) => {
  try {
    const lr = await LR.findByIdAndDelete(req.params.id);
    if (!lr) {
      return res.status(404).json({ message: 'LR not found' });
    }

    // Also delete any associated documents from Cloudinary
    if (lr.invoiceDocument?.publicId) {
      try {
        await cloudinary.uploader.destroy(lr.invoiceDocument.publicId, { resource_type: 'auto' });
      } catch (err) {
        console.error('Error deleting invoice from Cloudinary:', err);
      }
    }
    if (lr.billDocument?.publicId) {
      try {
        await cloudinary.uploader.destroy(lr.billDocument.publicId, { resource_type: 'auto' });
      } catch (err) {
        console.error('Error deleting bill from Cloudinary:', err);
      }
    }

    res.json({ message: 'LR deleted successfully' });
  } catch (error) {
    console.error('Delete LR error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload document to Cloudinary
exports.uploadLRDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Convert file buffer to base64
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: 'lrs/documents',
      resource_type: 'auto',
      public_id: `LR-DOC-${Date.now()}`
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('LR document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

// Delete document from Cloudinary and optionally LR
exports.deleteLRDocument = async (req, res) => {
  try {
    const { publicId, lrId, documentType } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'publicId is required'
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });

    // If lrId and documentType is provided, also update the LR document in database
    if (lrId && documentType) {
      const unsetQuery = {};
      unsetQuery[documentType] = 1;
      await LR.findByIdAndUpdate(lrId, {
        $unset: unsetQuery
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('LR document delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};
