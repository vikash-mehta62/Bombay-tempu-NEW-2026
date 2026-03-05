const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  createClientPOD,
  getPODByTripAndClient,
  updateClientPOD,
  uploadPODDocument,
  deleteClientPOD,
  getPODById,
  deleteDocument
} = require('../controllers/clientPODController');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(protect);

// Create client POD
router.post('/', createClientPOD);

// Get POD by trip and client
router.get('/trip/:tripId/client/:clientId', getPODByTripAndClient);

// Get POD by ID
router.get('/:id', getPODById);

// Update client POD
router.put('/:id', updateClientPOD);

// Upload POD document (with multer middleware)
router.post('/:id/upload', upload.single('document'), uploadPODDocument);

// Delete single document from POD
router.delete('/:id/document/:documentId', deleteDocument);

// Delete client POD
router.delete('/:id', deleteClientPOD);

module.exports = router;
