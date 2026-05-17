const LR = require('../models/LR');

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
    res.json({ message: 'LR deleted successfully' });
  } catch (error) {
    console.error('Delete LR error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
