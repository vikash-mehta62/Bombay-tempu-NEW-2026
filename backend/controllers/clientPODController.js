const ClientPOD = require('../models/ClientPOD');
const { createActivityLog } = require('../utils/activityLogger');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbtkldfa4',
  api_key: process.env.CLOUDINARY_API_KEY || '747527783338524',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YCPSLXMO0OYfwrUYNOYa_Xip_eo'
};

console.log('🔧 Cloudinary Config:');
console.log('Cloud Name:', cloudinaryConfig.cloud_name);
console.log('API Key:', cloudinaryConfig.api_key);
console.log('API Secret:', cloudinaryConfig.api_secret ? `${cloudinaryConfig.api_secret.substring(0, 5)}...` : 'NOT SET');

cloudinary.config(cloudinaryConfig);

// Create client POD
exports.createClientPOD = async (req, res) => {
  try {
    const { tripId, clientId, status, notes } = req.body;

    const pod = await ClientPOD.create({
      tripId,
      clientId,
      status,
      notes,
      createdBy: req.user._id
    });

    await pod.populate([
      { path: 'tripId', select: 'tripNumber' },
      { path: 'clientId', select: 'fullName companyName' },
      { path: 'createdBy', select: 'fullName username' }
    ]);

    await createActivityLog({
      user: req.user,
      action: `Created POD for client ${pod.clientId.fullName || pod.clientId.companyName}`,
      actionType: 'CREATE',
      module: 'ClientPOD',
      entityId: pod._id,
      entityType: 'ClientPOD',
      details: { tripId, clientId, status },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Client POD created successfully',
      data: pod
    });
  } catch (error) {
    console.error('Error creating client POD:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client POD',
      error: error.message
    });
  }
};

// Get POD by trip and client
exports.getPODByTripAndClient = async (req, res) => {
  try {
    const { tripId, clientId } = req.params;

    const pod = await ClientPOD.findOne({ 
      tripId, 
      clientId,
      isActive: true  // Only return active PODs
    }).populate([
      { path: 'tripId', select: 'tripNumber' },
      { path: 'clientId', select: 'fullName companyName' },
      { path: 'createdBy', select: 'fullName username' }
    ]);

    res.json({
      success: true,
      data: pod
    });
  } catch (error) {
    console.error('Error fetching client POD:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client POD',
      error: error.message
    });
  }
};

// Update client POD
exports.updateClientPOD = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const pod = await ClientPOD.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true, runValidators: true }
    ).populate([
      { path: 'tripId', select: 'tripNumber' },
      { path: 'clientId', select: 'fullName companyName' },
      { path: 'createdBy', select: 'fullName username' }
    ]);

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: 'Client POD not found'
      });
    }

    await createActivityLog({
      user: req.user,
      action: `Updated POD for client ${pod.clientId.fullName || pod.clientId.companyName}`,
      actionType: 'UPDATE',
      module: 'ClientPOD',
      entityId: pod._id,
      entityType: 'ClientPOD',
      details: { status, notes },
      req
    });

    res.json({
      success: true,
      message: 'Client POD updated successfully',
      data: pod
    });
  } catch (error) {
    console.error('Error updating client POD:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client POD',
      error: error.message
    });
  }
};

// Upload POD document
exports.uploadPODDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // Get status for this document

    // Check if files exist
    if (!req.files || !req.files.document) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.files.document;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF, JPG, JPEG, and PNG files are allowed'
      });
    }

    console.log('📤 Uploading to Cloudinary...');
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('Document status:', status);

    // Upload to Cloudinary using upload_stream
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'truck-management/pods',
          resource_type: 'auto',
          public_id: `POD-${Date.now()}-${Math.round(Math.random() * 1E9)}`
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary Error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary Success:', result.secure_url);
            resolve(result);
          }
        }
      );

      // Write buffer to stream
      uploadStream.end(file.data);
    });

    const result = await uploadPromise;
    const documentUrl = result.secure_url;

    // Add document to documents array
    const pod = await ClientPOD.findByIdAndUpdate(
      id,
      { 
        $push: {
          documents: {
            documentUrl,
            status: status || 'pod_received',
            notes: notes || '',
            uploadedBy: req.user._id,
            uploadedAt: new Date()
          }
        },
        // Also update legacy field for backward compatibility
        documentUrl,
        status: status || pod.status
      },
      { new: true }
    ).populate([
      { path: 'tripId', select: 'tripNumber' },
      { path: 'clientId', select: 'fullName companyName' },
      { path: 'createdBy', select: 'fullName username' },
      { path: 'documents.uploadedBy', select: 'fullName username' }
    ]);

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: 'Client POD not found'
      });
    }

    await createActivityLog({
      user: req.user,
      action: `Uploaded ${status || 'POD'} document for client ${pod.clientId.fullName || pod.clientId.companyName}`,
      actionType: 'UPDATE',
      module: 'ClientPOD',
      entityId: pod._id,
      entityType: 'ClientPOD',
      details: { documentUrl, fileName: file.name, status: status || 'pod_received' },
      req
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: pod
    });
  } catch (error) {
    console.error('❌ Error uploading POD document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

// Delete client POD (soft delete)
exports.deleteClientPOD = async (req, res) => {
  try {
    const { id } = req.params;

    const pod = await ClientPOD.findById(id).populate([
      { path: 'tripId', select: 'tripNumber' },
      { path: 'clientId', select: 'fullName companyName' },
      { path: 'createdBy', select: 'fullName username' }
    ]);

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: 'Client POD not found'
      });
    }

    // Delete all documents from Cloudinary
    if (pod.documents && pod.documents.length > 0) {
      for (const doc of pod.documents) {
        if (doc.documentUrl && doc.documentUrl.includes('cloudinary.com')) {
          try {
            const urlParts = doc.documentUrl.split('/');
            const uploadIndex = urlParts.indexOf('upload');
            if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
              const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
              const publicId = pathAfterVersion.replace(/\.[^/.]+$/, '');
              
              console.log('🗑️ Deleting from Cloudinary:', publicId);
              await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
              console.log('✅ Deleted from Cloudinary');
            }
          } catch (cloudinaryError) {
            console.error('❌ Error deleting from Cloudinary:', cloudinaryError);
          }
        }
      }
    }

    // Delete legacy document if exists
    if (pod.documentUrl && pod.documentUrl.includes('cloudinary.com')) {
      try {
        const urlParts = pod.documentUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = pathAfterVersion.replace(/\.[^/.]+$/, '');
          
          console.log('🗑️ Deleting legacy doc from Cloudinary:', publicId);
          await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
          console.log('✅ Deleted from Cloudinary');
        }
      } catch (cloudinaryError) {
        console.error('❌ Error deleting from Cloudinary:', cloudinaryError);
      }
    }

    // Soft delete
    const updatedPod = await ClientPOD.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).populate([
      { path: 'tripId', select: 'tripNumber' },
      { path: 'clientId', select: 'fullName companyName' },
      { path: 'createdBy', select: 'fullName username' }
    ]);

    await createActivityLog({
      user: req.user,
      action: `Deactivated POD for client ${pod.clientId.fullName || pod.clientId.companyName}`,
      actionType: 'DELETE',
      module: 'ClientPOD',
      entityId: id,
      entityType: 'ClientPOD',
      details: { podId: id, tripNumber: pod.tripId.tripNumber },
      req
    });

    res.json({
      success: true,
      message: 'Client POD deleted successfully',
      data: updatedPod
    });
  } catch (error) {
    console.error('❌ Error deleting client POD:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client POD',
      error: error.message
    });
  }
};

// Delete single document from POD
exports.deleteDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;

    const pod = await ClientPOD.findById(id).populate([
      { path: 'tripId', select: 'tripNumber' },
      { path: 'clientId', select: 'fullName companyName' }
    ]);

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: 'Client POD not found'
      });
    }

    // Find the document
    const document = pod.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete from Cloudinary
    if (document.documentUrl && document.documentUrl.includes('cloudinary.com')) {
      try {
        const urlParts = document.documentUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = pathAfterVersion.replace(/\.[^/.]+$/, '');
          
          console.log('🗑️ Deleting document from Cloudinary:', publicId);
          await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
          console.log('✅ Deleted from Cloudinary');
        }
      } catch (cloudinaryError) {
        console.error('❌ Error deleting from Cloudinary:', cloudinaryError);
      }
    }

    // Remove document from array
    pod.documents.pull(documentId);
    await pod.save();

    await createActivityLog({
      user: req.user,
      action: `Deleted ${document.status} document for client ${pod.clientId.fullName || pod.clientId.companyName}`,
      actionType: 'DELETE',
      module: 'ClientPOD',
      entityId: id,
      entityType: 'ClientPOD',
      details: { documentId, status: document.status },
      req
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
      data: pod
    });
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

// Get POD by ID
exports.getPODById = async (req, res) => {
  try {
    const { id } = req.params;

    const pod = await ClientPOD.findById(id).populate([
      { path: 'tripId', select: 'tripNumber' },
      { path: 'clientId', select: 'fullName companyName' },
      { path: 'createdBy', select: 'fullName username' }
    ]);

    if (!pod) {
      return res.status(404).json({
        success: false,
        message: 'Client POD not found'
      });
    }

    res.json({
      success: true,
      data: pod
    });
  } catch (error) {
    console.error('Error fetching client POD:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client POD',
      error: error.message
    });
  }
};
