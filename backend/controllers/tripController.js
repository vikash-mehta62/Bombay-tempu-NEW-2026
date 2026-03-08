const Trip = require('../models/Trip');
const ClientPOD = require('../models/ClientPOD');
const { createActivityLog } = require('../utils/activityLogger');

// Get all trips with pagination, search, and filters
exports.getAllTrips = async (req, res) => {
  try {
    const { 
      status, 
      search, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      showNoFixAmount // Filter for clientRate 1-10
    } = req.query;
    
    let query = { isActive: true };
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (startDate && endDate) {
      query.loadDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Client No Fix Amount filter (clientRate between 1-10)
    if (showNoFixAmount === 'true') {
      query['clients.clientRate'] = { $gte: 1, $lte: 10 };
    }
    
    console.log('Fetching trips with query:', query);
    console.log('Requested by user:', req.user?.fullName, '(', req.user?.role, ')');
    
    // Build the base query
    let tripsQuery = Trip.find(query)
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
      .sort({ createdAt: -1 }); // Sort by creation time, newest first
    
    // Execute query to get all trips for search
    let allTrips = await tripsQuery.exec();
    
    // Advanced search (trip number, client name, vehicle number, driver name, fleet owner name)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      allTrips = allTrips.filter(trip => {
        // Search in trip number
        if (trip.tripNumber?.toLowerCase().includes(searchLower)) return true;
        
        // Search in vehicle number
        if (trip.vehicleId?.vehicleNumber?.toLowerCase().includes(searchLower)) return true;
        
        // Search in driver name
        if (trip.driverId?.fullName?.toLowerCase().includes(searchLower)) return true;
        
        // Search in fleet owner name
        if (trip.vehicleId?.fleetOwnerId?.fullName?.toLowerCase().includes(searchLower)) return true;
        
        // Search in client names
        if (trip.clients?.some(c => 
          c.clientId?.fullName?.toLowerCase().includes(searchLower) ||
          c.clientId?.companyName?.toLowerCase().includes(searchLower)
        )) return true;
        
        return false;
      });
    }
    
    // Calculate pagination
    const totalTrips = allTrips.length;
    const totalPages = Math.ceil(totalTrips / limit);
    const currentPage = parseInt(page);
    const skip = (currentPage - 1) * limit;
    
    // Apply pagination
    const paginatedTrips = allTrips.slice(skip, skip + parseInt(limit));
    
    console.log(`Found ${totalTrips} trips, showing page ${currentPage} of ${totalPages}`);
    
    res.json({
      success: true,
      data: paginatedTrips,
      pagination: {
        currentPage,
        totalPages,
        totalTrips,
        limit: parseInt(limit),
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
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
      .populate('clients.destinationCity', 'cityName state pincode')
      .populate('podHistory.submittedBy', 'fullName username');
    
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
    
    // Update vehicle status to "on_trip"
    const Vehicle = require('../models/Vehicle');
    if (trip.vehicleId) {
      await Vehicle.findByIdAndUpdate(trip.vehicleId, {
        currentStatus: 'on_trip'
      });
    }
    
    // Update driver status to "on_trip"
    const Driver = require('../models/Driver');
    if (trip.driverId) {
      await Driver.findByIdAndUpdate(trip.driverId, {
        status: 'on_trip',
        currentVehicle: trip.vehicleId
      });
    }
    
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
          action: `Created trip ${trip.tripNumber} with ${trip.clients.length} client(s) and auto-generated PODs. Vehicle and driver marked as on_trip.`,
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
    // Get the old trip data to compare clients, vehicle, and driver
    const oldTrip = await Trip.findById(req.params.id);
    
    if (!oldTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Store old vehicle and driver IDs
    const oldVehicleId = oldTrip.vehicleId?.toString();
    const oldDriverId = oldTrip.driverId?.toString();
    const newVehicleId = req.body.vehicleId?.toString();
    const newDriverId = req.body.driverId?.toString();
    
    const Vehicle = require('../models/Vehicle');
    const Driver = require('../models/Driver');
    
    // If vehicle changed, release old vehicle and book new vehicle
    if (oldVehicleId && newVehicleId && oldVehicleId !== newVehicleId) {
      // Release old vehicle
      await Vehicle.findByIdAndUpdate(oldVehicleId, {
        currentStatus: 'available'
      });
      
      // Book new vehicle
      await Vehicle.findByIdAndUpdate(newVehicleId, {
        currentStatus: 'on_trip'
      });
    }
    
    // If driver changed, release old driver and book new driver
    if (oldDriverId && newDriverId && oldDriverId !== newDriverId) {
      // Release old driver
      await Driver.findByIdAndUpdate(oldDriverId, {
        status: 'available',
        currentVehicle: null
      });
      
      // Book new driver
      await Driver.findByIdAndUpdate(newDriverId, {
        status: 'on_trip',
        currentVehicle: newVehicleId
      });
    }
    
    // If driver was removed (self-owned to fleet-owned conversion)
    if (oldDriverId && !newDriverId) {
      await Driver.findByIdAndUpdate(oldDriverId, {
        status: 'available',
        currentVehicle: null
      });
    }
    
    // If driver was added (fleet-owned to self-owned conversion)
    if (!oldDriverId && newDriverId) {
      await Driver.findByIdAndUpdate(newDriverId, {
        status: 'on_trip',
        currentVehicle: newVehicleId
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
    const trip = await Trip.findById(req.params.id).populate('vehicleId driverId');
    
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
    
    // Update vehicle status to "available"
    const Vehicle = require('../models/Vehicle');
    if (trip.vehicleId) {
      await Vehicle.findByIdAndUpdate(trip.vehicleId._id, {
        currentStatus: 'available'
      });
    }
    
    // Update driver status to "available" and clear current vehicle
    const Driver = require('../models/Driver');
    if (trip.driverId) {
      await Driver.findByIdAndUpdate(trip.driverId._id, {
        status: 'available',
        currentVehicle: null
      });
    }
    
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
        action: `Deleted trip ${trip.tripNumber} and deactivated all related records (advances, expenses, payments, PODs). Vehicle and driver marked as available.`,
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
    ).populate('vehicleId driverId');
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    const Vehicle = require('../models/Vehicle');
    const Driver = require('../models/Driver');
    
    // If trip status is "in_progress", ensure vehicle and driver are marked as on_trip
    if (status === 'in_progress') {
      // Update vehicle status to "on_trip"
      if (trip.vehicleId) {
        await Vehicle.findByIdAndUpdate(trip.vehicleId._id, {
          currentStatus: 'on_trip'
        });
      }
      
      // Update driver status to "on_trip"
      if (trip.driverId) {
        await Driver.findByIdAndUpdate(trip.driverId._id, {
          status: 'on_trip',
          currentVehicle: trip.vehicleId._id
        });
      }
      
      // Log activity
      if (req.user) {
        await createActivityLog({
          user: req.user,
          action: `Started trip ${trip.tripNumber}. Vehicle and driver marked as on_trip.`,
          actionType: 'UPDATE',
          module: 'Trip',
          entityId: trip._id,
          entityType: 'Trip',
          details: { tripNumber: trip.tripNumber, status: 'in_progress' },
          req
        });
      }
    }
    
    // If trip status is "completed", update vehicle and driver status to "available"
    if (status === 'completed') {
      // Update vehicle status to "available"
      if (trip.vehicleId) {
        await Vehicle.findByIdAndUpdate(trip.vehicleId._id, {
          currentStatus: 'available'
        });
      }
      
      // Update driver status to "available" and clear current vehicle
      if (trip.driverId) {
        await Driver.findByIdAndUpdate(trip.driverId._id, {
          status: 'available',
          currentVehicle: null
        });
      }
      
      // Log activity
      if (req.user) {
        await createActivityLog({
          user: req.user,
          action: `Completed trip ${trip.tripNumber}. Vehicle and driver marked as available.`,
          actionType: 'UPDATE',
          module: 'Trip',
          entityId: trip._id,
          entityType: 'Trip',
          details: { tripNumber: trip.tripNumber, status: 'completed' },
          req
        });
      }
    }
    
    // If trip status is "cancelled", update vehicle and driver status to "available"
    if (status === 'cancelled') {
      // Update vehicle status to "available"
      if (trip.vehicleId) {
        await Vehicle.findByIdAndUpdate(trip.vehicleId._id, {
          currentStatus: 'available'
        });
      }
      
      // Update driver status to "available" and clear current vehicle
      if (trip.driverId) {
        await Driver.findByIdAndUpdate(trip.driverId._id, {
          status: 'available',
          currentVehicle: null
        });
      }
      
      // Log activity
      if (req.user) {
        await createActivityLog({
          user: req.user,
          action: `Cancelled trip ${trip.tripNumber}. Vehicle and driver marked as available.`,
          actionType: 'UPDATE',
          module: 'Trip',
          entityId: trip._id,
          entityType: 'Trip',
          details: { tripNumber: trip.tripNumber, status: 'cancelled' },
          req
        });
      }
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

// Get trip statistics (Overall stats for all trips)
exports.getTripStats = async (req, res) => {
  try {
    // Get all active trips
    const allTrips = await Trip.find({ isActive: true });
    
    // Calculate overall stats
    const totalTrips = allTrips.length;
    const totalRevenue = allTrips.reduce((sum, trip) => sum + (trip.totalClientRevenue || 0), 0);
    const totalProfit = allTrips.reduce((sum, trip) => sum + (trip.profitLoss || 0), 0);
    const inProgressTrips = allTrips.filter(t => t.status === 'in_progress').length;
    
    // Stats by status
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
    
    res.json({
      success: true,
      data: {
        overall: {
          totalTrips,
          totalRevenue,
          totalProfit,
          inProgressTrips
        },
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Error fetching trip stats:', error);
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
