const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all clients
router.get('/', clientController.getAllClients);

// Get client statistics
router.get('/stats', authorize('admin'), clientController.getClientStats);

// Search clients dropdown (lightweight)
router.get('/search-dropdown', clientController.searchClientsDropdown);

// Get client statement with transactions
router.get('/:id/statement', clientController.getClientStatement);

// Get client by ID
router.get('/:id', clientController.getClientById);

// Create new client
router.post('/', authorize('admin'), clientController.createClient);

// Update client
router.put('/:id', authorize('admin'), clientController.updateClient);

// Delete client
router.delete('/:id', authorize('admin'), clientController.deleteClient);

module.exports = router;
