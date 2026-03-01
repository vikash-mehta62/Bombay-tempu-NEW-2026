const express = require('express');
const router = express.Router();
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

// Upload POD document (no multer middleware needed)
router.post('/:id/upload', uploadPODDocument);

// Delete single document from POD
router.delete('/:id/document/:documentId', deleteDocument);

// Delete client POD
router.delete('/:id', deleteClientPOD);

module.exports = router;
