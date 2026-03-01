const Trip = require('../models/Trip');
const ClientPOD = require('../models/ClientPOD');
const { createActivityLog } = require('../utils/activityLogger');

// Get all trips
exports.getAllTrips = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;
    
    let query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.tripNumber = { $regex: search, $options: 'i' };
    }
    
    if (startDate && endDate) {
      query.loadDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    console.log('Fetching trips with query:', query);
    console.log('Requested by user:', req.user?.fullName, '(', req.user?.role, ')');
    
    const trips = await Trip.find(query)
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
      .sort({ loadDate: -1 });
    
    console.log(`Found ${trips.length} trips`);
    
    res.json({
      success: true,
      data: trips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get trip by ID
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate({
        path: 'vehicleId',
        populate: {
          path: 'fleetOwnerId',
          select: 'fullName contact companyName'
        }
      })
      .populate('driverId', 'fullName contact licenseNumber')
      .populate('clients.clientId', 'fullName companyName contact email')
      .populate('clients.originCity', 'cityName state pincode')
      .populate('clients.destinationCity', 'cityName state pincode');
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new trip
exports.createTrip = async (req, res) => {
  try {
    const trip = new Trip(req.body);
    await trip.save();
    
    // Populate references with fleet owner
    await trip.populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleType brand model ownershipType',
      populate: {
        path: 'fleetOwnerId',
        select: 'fullName contact companyName'
      }
    });
    await trip.populate('driverId', 'fullName contact');
    await trip.populate('clients.clientId', 'fullName companyName');
    await trip.populate('clients.originCity', 'cityName state');
    await trip.populate('clients.destinationCity', 'cityName state');
    
    // Automatically create POD for each client with "pod_pending" status
    if (trip.clients && trip.clients.length > 0) {
      const podPromises = trip.clients.map(client => {
        return ClientPOD.create({
          tripId: trip._id,
          clientId: client.clientId._id,
          status: 'pod_pending',
          notes: 'Automatically created on trip creation',
          createdBy: req.user?._id,
          isActive: true
        });
      });
      
      await Promise.all(podPromises);
      
      // Log activity
      if (req.user) {
        await createActivityLog({
          user: req.user,
          action: `Created trip ${trip.tripNumber} with ${trip.clients.length} client(s) and auto-generated PODs`,
          actionType: 'CREATE',
          module: 'Trip',
          entityId: trip._id,
          entityType: 'Trip',
          details: { tripNumber: trip.tripNumber, clientCount: trip.clients.length },
          req
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: trip
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update trip
exports.updateTrip = async (req, res) => {
  try {
    // Get the old trip data to compare clients
    const oldTrip = await Trip.findById(req.params.id);
    
    if (!oldTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Update the trip fields
    Object.keys(req.body).forEach(key => {
      oldTrip[key] = req.body[key];
    });
    
    // Save the trip (this will trigger pre-save hook for profit calculation)
    await oldTrip.save();
    
    // Populate the trip data
    const trip = await Trip.findById(req.params.id)
      .populate({
        path: 'vehicleId',
        populate: {
          path: 'fleetOwnerId',
          select: 'fullName contact companyName'
        }
      })
      .populate('driverId', 'fullName contact')
      .populate('clients.clientId', 'fullName companyName contact')
      .populate('clients.originCity', 'cityName state')
      .populate('clients.destinationCity', 'cityName state');
    
    // Handle client changes - deactivate PODs for removed clients
    if (oldTrip.clients && trip.clients) {
      const oldClientIds = oldTrip.clients.map(c => c.clientId.toString());
      const newClientIds = trip.clients.map(c => c.clientId._id.toString());
      
      // Find removed clients
      const removedClientIds = oldClientIds.filter(id => !newClientIds.includes(id));
      
      // Deactivate PODs for removed clients
      if (removedClientIds.length > 0) {
        await ClientPOD.updateMany(
          {
            tripId: req.params.id,
            clientId: { $in: removedClientIds }
          },
          {
            isActive: false
          }
        );
        
        // Log activity
        if (req.user) {
          await createActivityLog({
            user: req.user,
            action: `Updated trip ${trip.tripNumber} - Deactivated PODs for ${removedClientIds.length} removed client(s)`,
            actionType: 'UPDATE',
            module: 'Trip',
            entityId: trip._id,
            entityType: 'Trip',
            details: { tripNumber: trip.tripNumber, removedClients: removedClientIds.length },
            req
          });
        }
      }
      
      // Find newly added clients
      const addedClientIds = newClientIds.filter(id => !oldClientIds.includes(id));
      
      // Create PODs for newly added clients
      if (addedClientIds.length > 0) {
        const podPromises = addedClientIds.map(clientId => {
          return ClientPOD.create({
            tripId: trip._id,
            clientId: clientId,
            status: 'pod_pending',
            notes: 'Automatically created when client was added to trip',
            createdBy: req.user?._id,
            isActive: true
          });
        });
        
        await Promise.all(podPromises);
        
        // Log activity
        if (req.user) {
          await createActivityLog({
            user: req.user,
            action: `Updated trip ${trip.tripNumber} - Created PODs for ${addedClientIds.length} new client(s)`,
            actionType: 'UPDATE',
            module: 'Trip',
            entityId: trip._id,
            entityType: 'Trip',
            details: { tripNumber: trip.tripNumber, addedClients: addedClientIds.length },
            req
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: trip
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete trip (soft delete)
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Mark trip as inactive
    trip.isActive = false;
    trip.status = 'cancelled';
    await trip.save();
    
    // Mark all related records as inactive
    const TripAdvance = require('../models/TripAdvance');
    const TripExpense = require('../models/TripExpense');
    const ClientExpense = require('../models/ClientExpense');
    const ClientPayment = require('../models/ClientPayment');
    const AdjustmentPayment = require('../models/AdjustmentPayment');
    const ClientPOD = require('../models/ClientPOD');
    
    // Deactivate all trip advances
    await TripAdvance.updateMany(
      { tripId: req.params.id },
      { isActive: false }
    );
    
    // Deactivate all trip expenses
    await TripExpense.updateMany(
      { tripId: req.params.id },
      { isActive: false }
    );
    
    // Deactivate all client expenses for this trip
    await ClientExpense.updateMany(
      { tripId: req.params.id },
      { isActive: false }
    );
    
    // Deactivate all client payments for this trip
    await ClientPayment.updateMany(
      { tripId: req.params.id },
      { isActive: false }
    );
    
    // Deactivate all adjustment payments for this trip
    await AdjustmentPayment.updateMany(
      { tripId: req.params.id },
      { isActive: false }
    );
    
    // Deactivate all PODs for this trip
    await ClientPOD.updateMany(
      { tripId: req.params.id },
      { isActive: false }
    );
    
    // Log activity
    if (req.user) {
      await createActivityLog({
        user: req.user,
        action: `Deleted trip ${trip.tripNumber} and deactivated all related records (advances, expenses, payments, PODs)`,
        actionType: 'DELETE',
        module: 'trips',
        entityId: trip._id,
        entityType: 'Trip',
        details: { tripNumber: trip.tripNumber },
        req
      });
    }
    
    res.json({
      success: true,
      message: 'Trip and all related records deleted successfully',
      data: trip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update trip status
exports.updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Trip status updated successfully',
      data: trip
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get trip statistics
exports.getTripStats = async (req, res) => {
  try {
    const stats = await Trip.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalClientRevenue' },
          totalProfit: { $sum: '$profitLoss' }
        }
      }
    ]);
    
    const total = await Trip.countDocuments({ isActive: true });
    
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


// Update actual POD amount
exports.updateActualPodAmt = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualPodAmt, paymentType, notes } = req.body;

    const trip = await Trip.findById(id).populate('vehicleId');
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if fleet owned
    const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
    if (!isFleetOwned) {
      return res.status(400).json({
        success: false,
        message: 'POD submission is only for fleet-owned vehicles'
      });
    }

    const fleetOwnerId = trip.vehicleId.fleetOwnerId;
    if (!fleetOwnerId) {
      return res.status(400).json({
        success: false,
        message: 'Fleet owner not found'
      });
    }

    // Check for duplicate POD submission within last 15 minutes
    const TripAdvance = require('../models/TripAdvance');
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const duplicateCheck = await TripAdvance.findOne({
      tripId: trip._id,
      amount: actualPodAmt,
      advanceType: 'pod_submission',
      createdBy: req.user._id,
      isActive: true,
      createdAt: { $gte: fifteenMinutesAgo }
    });

    if (duplicateCheck) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate POD submission detected. Same amount was submitted within last 15 minutes.' 
      });
    }

    // First time: Backup original podBalance to actualPodAmt
    if (trip.actualPodAmt === 0) {
      trip.actualPodAmt = trip.podBalance;
    }
    
    // Store balance before submission
    const balanceBeforeSubmission = trip.podBalance;
    
    // Calculate new balance (subtract submitted amount)
    const newBalance = balanceBeforeSubmission - actualPodAmt;
    
    // Create advance entry for fleet owner
    const advance = await TripAdvance.create({
      tripId: trip._id,
      fleetOwnerId: fleetOwnerId,
      amount: actualPodAmt,
      description: `POD Submission: ${notes || 'POD payment'}`,
      paymentMethod: paymentType || 'cash',
      date: new Date(),
      advanceType: 'pod_submission',
      createdBy: req.user._id,
      isActive: true
    });
    
    // Update trip - add to history with advance reference
    trip.podBalance = newBalance;
    trip.podHistory = trip.podHistory || [];
    trip.podHistory.push({
      submittedAmount: actualPodAmt,
      paymentType: paymentType || 'cash',
      notes: notes || '',
      submittedBy: req.user._id,
      submittedAt: new Date(),
      balanceBeforeSubmission: balanceBeforeSubmission,
      balanceAfterSubmission: newBalance,
      advanceId: advance._id
    });
    
    await trip.save();
    
    // Update advance with podHistoryId (last entry in podHistory)
    const lastHistoryEntry = trip.podHistory[trip.podHistory.length - 1];
    advance.podHistoryId = lastHistoryEntry._id;
    await advance.save();
    
    // Populate for response
    await trip.populate([
      {
        path: 'vehicleId',
        select: 'vehicleNumber vehicleType brand model ownershipType',
        populate: {
          path: 'fleetOwnerId',
          select: 'fullName contact'
        }
      },
      { path: 'driverId', select: 'fullName contact' },
      { path: 'clients.clientId', select: 'fullName companyName contact' },
      { path: 'clients.originCity', select: 'cityName state' },
      { path: 'clients.destinationCity', select: 'cityName state' },
      { path: 'podHistory.submittedBy', select: 'fullName username' }
    ]);

    await createActivityLog({
      user: req.user,
      action: `Submitted POD amount ₹${actualPodAmt} for trip ${trip.tripNumber}. Balance: ₹${balanceBeforeSubmission} → ₹${newBalance}. Advance created.`,
      actionType: 'UPDATE',
      module: 'Trip',
      entityId: trip._id,
      entityType: 'Trip',
      details: { 
        submittedAmount: actualPodAmt,
        balanceBeforeSubmission,
        balanceAfterSubmission: newBalance,
        originalPodBalance: trip.actualPodAmt,
        advanceId: advance._id,
        tripNumber: trip.tripNumber 
      },
      req
    });

    res.json({
      success: true,
      message: 'POD amount submitted and advance created successfully',
      data: trip
    });
  } catch (error) {
    console.error('Error updating actual POD amount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update actual POD amount',
      error: error.message
    });
  }
};
