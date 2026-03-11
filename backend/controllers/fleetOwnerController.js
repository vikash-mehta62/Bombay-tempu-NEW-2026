const FleetOwner = require('../models/FleetOwner');
const Vehicle = require('../models/Vehicle');

/**
 * @desc    Get all fleet owners
 * @route   GET /api/fleet-owners
 * @access  Private (admin)
 */
exports.getAllFleetOwners = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    const fleetOwners = await FleetOwner.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: fleetOwners.length,
      data: fleetOwners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single fleet owner
 * @route   GET /api/fleet-owners/:id
 * @access  Private
 */
exports.getFleetOwnerById = async (req, res) => {
  try {
    const fleetOwner = await FleetOwner.findById(req.params.id);

    if (!fleetOwner) {
      return res.status(404).json({
        success: false,
        message: 'Fleet owner not found'
      });
    }

    // Get vehicles count
    const vehiclesCount = await Vehicle.countDocuments({ 
      fleetOwnerId: req.params.id,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: {
        ...fleetOwner.toObject(),
        totalVehicles: vehiclesCount
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
 * @desc    Create fleet owner
 * @route   POST /api/fleet-owners
 * @access  Private (admin)
 */
exports.createFleetOwner = async (req, res) => {
  try {
    const { fullName, contact, username } = req.body;

    // Check if contact already exists
    const existingOwner = await FleetOwner.findOne({ contact });
    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: 'Fleet owner with this contact already exists'
      });
    }

    // If username provided, check if it exists
    if (username) {
      const existingUsername = await FleetOwner.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    // Set default password if username provided
    const fleetOwnerData = { ...req.body };
    if (username && !req.body.password) {
      fleetOwnerData.password = '12345678';
    }

    const fleetOwner = await FleetOwner.create(fleetOwnerData);

    res.status(201).json({
      success: true,
      message: 'Fleet owner created successfully',
      data: fleetOwner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update fleet owner
 * @route   PUT /api/fleet-owners/:id
 * @access  Private (admin)
 */
exports.updateFleetOwner = async (req, res) => {
  try {
    const fleetOwner = await FleetOwner.findById(req.params.id);
    
    if (!fleetOwner) {
      return res.status(404).json({
        success: false,
        message: 'Fleet owner not found'
      });
    }

    // Store original data for logging
    req.originalData = fleetOwner.toObject();

    const updatedOwner = await FleetOwner.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Fleet owner updated successfully',
      data: updatedOwner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete fleet owner (soft delete)
 * @route   DELETE /api/fleet-owners/:id
 * @access  Private (admin)
 */
exports.deleteFleetOwner = async (req, res) => {
  try {
    const fleetOwner = await FleetOwner.findById(req.params.id);

    if (!fleetOwner) {
      return res.status(404).json({
        success: false,
        message: 'Fleet owner not found'
      });
    }

    // Check if has vehicles
    const vehiclesCount = await Vehicle.countDocuments({ 
      fleetOwnerId: req.params.id,
      isActive: true 
    });

    if (vehiclesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete fleet owner with ${vehiclesCount} active vehicles`
      });
    }

    // Store deleted data for logging
    req.deletedData = {
      fullName: fleetOwner.fullName,
      contact: fleetOwner.contact
    };

    // Soft delete
    fleetOwner.isActive = false;
    await fleetOwner.save();

    res.status(200).json({
      success: true,
      message: 'Fleet owner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get fleet owner's vehicles
 * @route   GET /api/fleet-owners/:id/vehicles
 * @access  Private
 */
exports.getFleetOwnerVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ 
      fleetOwnerId: req.params.id,
      isActive: true 
    }).sort({ createdAt: -1 });

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
 * @desc    Get fleet owner statement with complete trip details
 * @route   GET /api/fleet-owners/:id/statement
 * @access  Private
 */
exports.getFleetOwnerStatement = async (req, res) => {
  try {
    const Trip = require('../models/Trip');
    const TripAdvance = require('../models/TripAdvance');
    const TripExpense = require('../models/TripExpense');
    
    // Get all vehicles for this fleet owner
    const vehicles = await Vehicle.find({ 
      fleetOwnerId: req.params.id,
      isActive: true 
    }).select('_id');
    
    const vehicleIds = vehicles.map(v => v._id);
    
    // Get all trips for these vehicles
    const trips = await Trip.find({
      vehicleId: { $in: vehicleIds },
      isActive: true
    })
    .populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleType brand model ownershipType',
      populate: {
        path: 'fleetOwnerId',
        select: 'fullName contact'
      }
    })
    .populate('driverId', 'fullName contact')
    .populate('clients.clientId', 'fullName companyName contact')
    .populate('clients.originCity', 'cityName state')
    .populate('clients.destinationCity', 'cityName state')
    .populate('podHistory.submittedBy', 'fullName username')
    .sort({ loadDate: -1 });
    
    // Get advances and expenses for each trip
    const tripsWithDetails = await Promise.all(trips.map(async (trip) => {
      const advances = await TripAdvance.find({
        tripId: trip._id,
        isActive: true
      })
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });
      
      const expenses = await TripExpense.find({
        tripId: trip._id,
        isActive: true
      })
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });
      
      // Calculate totals
      const hireTotal = trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;
      const expensesTotal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const advancesTotal = advances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
      
      let commission = trip.commissionAmount || 0;
      if (trip.commissionType === 'to_fleet_owner') {
        commission = -commission;
      }
      
      const podBalance = trip.podBalance || 0;
      const pending = (hireTotal + expensesTotal) - commission - podBalance - advancesTotal;
      
      return {
        ...trip.toObject(),
        advances,
        expenses,
        calculations: {
          hireTotal,
          expensesTotal,
          advancesTotal,
          commission,
          podBalance,
          pending
        }
      };
    }));
    
    // Calculate overall stats
    const stats = {
      totalTrips: trips.length,
      totalHire: tripsWithDetails.reduce((sum, t) => sum + t.calculations.hireTotal, 0),
      totalExpenses: tripsWithDetails.reduce((sum, t) => sum + t.calculations.expensesTotal, 0),
      totalCommission: tripsWithDetails.reduce((sum, t) => sum + t.calculations.commission, 0),
      totalPOD: tripsWithDetails.reduce((sum, t) => sum + t.calculations.podBalance, 0),
      advancesPaid: tripsWithDetails.reduce((sum, t) => sum + t.calculations.advancesTotal, 0),
      pendingAmount: tripsWithDetails.reduce((sum, t) => sum + t.calculations.pending, 0)
    };
    
    stats.totalAmount = stats.totalHire + stats.totalExpenses;
    stats.podPending = stats.totalPOD;
    
    res.status(200).json({
      success: true,
      data: {
        trips: tripsWithDetails,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching fleet owner statement:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
