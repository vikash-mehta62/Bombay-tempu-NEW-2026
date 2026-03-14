const Trip = require('../models/Trip');
const TripAdvance = require('../models/TripAdvance');
const TripExpense = require('../models/TripExpense');
const Expense = require('../models/Expense');

/**
 * @desc    Get comprehensive reports
 * @route   GET /api/reports
 * @access  Private (owner, manager, admin)
 */
exports.getReports = async (req, res) => {
  try {
    // Get all active trips with vehicle details
    const activeTrips = await Trip.find({ isActive: true }).populate('vehicleId');
    
    // Total Trips
    const totalTrips = activeTrips.length;
    
    // Completed Trips
    const completedTrips = activeTrips.filter(trip => trip.status === 'completed').length;
    
    // Trip Profit (sum of all trip profitLoss)
    const tripProfit = activeTrips.reduce((sum, trip) => {
      return sum + (trip.profitLoss || 0);
    }, 0);
    
    // Commission (sum of commissions where commissionType === 'from_fleet_owner')
    const commission = activeTrips.reduce((sum, trip) => {
      // Only count commission if type is 'from_fleet_owner'
      if (trip.commissionType === 'from_fleet_owner') {
        return sum + (trip.commissionAmount || 0);
      }
      return sum;
    }, 0);
    
    // Trip Difference (Client Rate - Hire Cost) - ONLY for fleet-owned vehicles
    const tripDifference = activeTrips.reduce((sum, trip) => {
      // Only calculate for fleet-owned vehicles
      if (trip.vehicleId?.ownershipType === 'fleet_owner' && trip.clients) {
        // Sum up (clientRate - truckHireCost) for all clients in this trip
        const tripDiff = trip.clients.reduce((clientSum, client) => {
          const clientRate = client.clientRate || 0;
          const hireCost = client.truckHireCost || 0;
          return clientSum + (clientRate - hireCost);
        }, 0);
        return sum + tripDiff;
      }
      return sum;
    }, 0);
    
    // Get all active trip IDs
    const activeTripIds = activeTrips.map(trip => trip._id);
    
    // Fleet Advances
    const fleetAdvancesResult = await TripAdvance.aggregate([
      {
        $match: {
          isActive: true,
          tripId: { $in: activeTripIds }
        }
      },
      {
        $lookup: {
          from: 'trips',
          localField: 'tripId',
          foreignField: '_id',
          as: 'trip'
        }
      },
      {
        $unwind: '$trip'
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'trip.vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      {
        $unwind: '$vehicle'
      },
      {
        $match: {
          'vehicle.ownershipType': 'fleet_owner'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const fleetAdvances = fleetAdvancesResult.length > 0 ? fleetAdvancesResult[0].total : 0;
    
    // Fleet Expenses
    const fleetExpensesResult = await TripExpense.aggregate([
      {
        $match: {
          isActive: true,
          tripId: { $in: activeTripIds }
        }
      },
      {
        $lookup: {
          from: 'trips',
          localField: 'tripId',
          foreignField: '_id',
          as: 'trip'
        }
      },
      {
        $unwind: '$trip'
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'trip.vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      {
        $unwind: '$vehicle'
      },
      {
        $match: {
          'vehicle.ownershipType': 'fleet_owner'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const fleetExpenses = fleetExpensesResult.length > 0 ? fleetExpensesResult[0].total : 0;
    
    // Driver Advances
    const driverAdvancesResult = await TripAdvance.aggregate([
      {
        $match: {
          isActive: true,
          tripId: { $in: activeTripIds }
        }
      },
      {
        $lookup: {
          from: 'trips',
          localField: 'tripId',
          foreignField: '_id',
          as: 'trip'
        }
      },
      {
        $unwind: '$trip'
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'trip.vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      {
        $unwind: '$vehicle'
      },
      {
        $match: {
          'vehicle.ownershipType': 'self_owned'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const driverAdvances = driverAdvancesResult.length > 0 ? driverAdvancesResult[0].total : 0;
    
    // Driver Expenses
    const driverExpensesResult = await TripExpense.aggregate([
      {
        $match: {
          isActive: true,
          tripId: { $in: activeTripIds }
        }
      },
      {
        $lookup: {
          from: 'trips',
          localField: 'tripId',
          foreignField: '_id',
          as: 'trip'
        }
      },
      {
        $unwind: '$trip'
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'trip.vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      {
        $unwind: '$vehicle'
      },
      {
        $match: {
          'vehicle.ownershipType': 'self_owned'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const driverExpenses = driverExpensesResult.length > 0 ? driverExpensesResult[0].total : 0;
    
    // Trip Expenses = Fleet Advances + Fleet Expenses + Driver Advances + Driver Expenses
    const tripExpenses = fleetAdvances + fleetExpenses + driverAdvances + driverExpenses;
    
    // Other Expenses (General expenses)
    const otherExpensesResult = await Expense.aggregate([
      {
        $match: {
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const otherExpenses = otherExpensesResult.length > 0 ? otherExpensesResult[0].total : 0;
    
    // Total Expenses
    const totalExpenses = tripExpenses + otherExpenses;
    
    // Final Profit = Trip Profit - Total Expenses
    const finalProfit = tripProfit - totalExpenses;
    
    // Total PODs (trips with podBalance > 0)
    const totalPods = activeTrips.reduce((sum, trip) => {
      return sum + (trip.podBalance || 0);
    }, 0);
    
    // Pending PODs count (trips where podBalance > 0)
    const pendingPods = activeTrips.filter(trip => (trip.podBalance || 0) > 0).length;
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          tripProfit,
          commission,
          tripDifference,
          tripExpenses,
          tripExpensesBreakdown: {
            fleetAdvances,
            fleetExpenses,
            driverAdvances,
            driverExpenses
          },
          otherExpenses,
          totalExpenses,
          finalProfit
        },
        summary: {
          totalTrips,
          completedTrips,
          totalPods,
          pendingPods
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get profit breakdown by vehicle type
 * @route   GET /api/reports/profit-breakdown
 * @access  Private (owner, manager)
 */
exports.getProfitBreakdown = async (req, res) => {
  try {
    const profitByVehicleType = await Trip.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      {
        $unwind: '$vehicle'
      },
      {
        $group: {
          _id: '$vehicle.ownershipType',
          totalProfit: { $sum: '$profitLoss' },
          totalRevenue: { $sum: '$totalClientRevenue' },
          tripCount: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: profitByVehicleType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get maintenance report with expiry tracking
 * @route   GET /api/reports/maintenance
 * @access  Private (owner, manager, admin)
 */
exports.getMaintenanceCosts = async (req, res) => {
  try {
    const Vehicle = require('../models/Vehicle');
    
    // Get all active SELF-OWNED vehicles with their maintenance dates
    const vehicles = await Vehicle.find({ 
      isActive: true,
      ownershipType: 'self_owned'
    })
      .select('vehicleNumber fitnessExpiryDate taxValidUptoDate insuranceExpiryDate pucExpiryDate permitExpiryDate nationalPermitExpiryDate')
      .sort({ vehicleNumber: 1 });
    
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
    
    // Process each vehicle to determine expiry status
    const maintenanceData = vehicles.map(vehicle => {
      const checkExpiry = (date) => {
        if (!date) return { status: 'missing', color: 'gray' };
        const expiryDate = new Date(date);
        
        if (expiryDate < today) {
          return { status: 'expired', color: 'red' };
        } else if (expiryDate <= oneMonthFromNow) {
          return { status: 'expiring_soon', color: 'red' };
        } else if (expiryDate <= twoMonthsFromNow) {
          return { status: 'warning', color: 'yellow' };
        } else {
          return { status: 'valid', color: 'green' };
        }
      };
      
      return {
        vehicleNumber: vehicle.vehicleNumber,
        fitness: {
          date: vehicle.fitnessExpiryDate,
          ...checkExpiry(vehicle.fitnessExpiryDate)
        },
        tax: {
          date: vehicle.taxValidUptoDate,
          ...checkExpiry(vehicle.taxValidUptoDate)
        },
        insurance: {
          date: vehicle.insuranceExpiryDate,
          ...checkExpiry(vehicle.insuranceExpiryDate)
        },
        pucc: {
          date: vehicle.pucExpiryDate,
          ...checkExpiry(vehicle.pucExpiryDate)
        },
        permit: {
          date: vehicle.permitExpiryDate,
          ...checkExpiry(vehicle.permitExpiryDate)
        },
        nationalPermit: {
          date: vehicle.nationalPermitExpiryDate,
          ...checkExpiry(vehicle.nationalPermitExpiryDate)
        }
      };
    });
    
    // Count vehicles by status
    const summary = {
      total: vehicles.length,
      expired: 0,
      expiringSoon: 0,
      warning: 0,
      valid: 0
    };
    
    maintenanceData.forEach(vehicle => {
      ['fitness', 'tax', 'insurance', 'pucc', 'permit', 'nationalPermit'].forEach(field => {
        if (vehicle[field].status === 'expired' || vehicle[field].status === 'expiring_soon') {
          summary.expired++;
        } else if (vehicle[field].status === 'warning') {
          summary.warning++;
        } else if (vehicle[field].status === 'valid') {
          summary.valid++;
        }
      });
    });
    
    res.status(200).json({
      success: true,
      data: {
        vehicles: maintenanceData,
        summary
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
 * @desc    Get POD reports
 * @route   GET /api/reports/pods
 * @access  Private (owner, manager, admin)
 */
exports.getPODReports = async (req, res) => {
  try {
    const ClientPOD = require('../models/ClientPOD');
    const { status, search, startDate, endDate } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    // Get all PODs with populated data
    const pods = await ClientPOD.find(query)
      .populate({
        path: 'tripId',
        select: 'tripNumber loadDate clients',
        match: { isActive: true },
        populate: [
          {
            path: 'clients.originCity',
            select: 'cityName'
          },
          {
            path: 'clients.destinationCity',
            select: 'cityName'
          }
        ]
      })
      .populate('clientId', 'fullName companyName')
      .sort({ createdAt: -1 });
    
    // Filter out PODs where trip is null (inactive trips)
    let filteredPods = pods.filter(pod => pod.tripId !== null);
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPods = filteredPods.filter(pod => {
        const tripNumber = pod.tripId?.tripNumber?.toLowerCase() || '';
        const clientName = pod.clientId?.fullName?.toLowerCase() || '';
        const companyName = pod.clientId?.companyName?.toLowerCase() || '';
        
        return tripNumber.includes(searchLower) || 
               clientName.includes(searchLower) || 
               companyName.includes(searchLower);
      });
    }
    
    // Apply date filter
    if (startDate || endDate) {
      filteredPods = filteredPods.filter(pod => {
        const podDate = new Date(pod.createdAt);
        if (startDate && podDate < new Date(startDate)) return false;
        if (endDate && podDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    // Format PODs for response
    const formattedPods = filteredPods.map(pod => {
      const trip = pod.tripId;
      const client = pod.clientId;
      
      // Find client details in trip
      const clientInTrip = trip?.clients?.find(c => c.clientId?.toString() === client?._id?.toString());
      
      return {
        _id: pod._id,
        tripNumber: trip?.tripNumber || 'N/A',
        tripId: trip?._id,
        clientName: client?.fullName || client?.companyName || 'Unknown',
        clientId: client?._id,
        origin: clientInTrip?.originCity?.cityName || 'N/A',
        destination: clientInTrip?.originCity?.cityName || 'N/A',
        status: pod.status,
        date: clientInTrip?.loadDate || trip?.loadDate || pod.createdAt, // Use client load date
        documents: pod.documents || []
      };
    });
    
    // Count by status
    const statusCounts = {
      pod_pending: filteredPods.filter(p => p.status === 'pod_pending').length,
      pod_received: filteredPods.filter(p => p.status === 'pod_received').length,
      pod_submitted: filteredPods.filter(p => p.status === 'pod_submitted').length,
      settled: filteredPods.filter(p => p.status === 'settled').length
    };
    
    res.status(200).json({
      success: true,
      data: {
        pods: formattedPods,
        statusCounts,
        total: formattedPods.length
      }
    });
  } catch (error) {
    console.error('Error fetching POD reports:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get client payment report - clients with no payments
 * @route   GET /api/reports/client-no-payment
 * @access  Private (owner, manager, admin)
 */
exports.getClientPaymentReport = async (req, res) => {
  try {
    const ClientPayment = require('../models/ClientPayment');
    const Vehicle = require('../models/Vehicle');
    
    // Get all active trips with client and vehicle details
    const trips = await Trip.find({ isActive: true })
      .populate('vehicleId', 'vehicleNumber')
      .populate('clients.clientId', 'fullName companyName')
      .lean();
    
    // Get all client payments
    const payments = await ClientPayment.find({ isActive: true }).lean();
    
    // Create a map of tripId + clientId -> total payments
    const paymentMap = {};
    payments.forEach(payment => {
      const key = `${payment.tripId}_${payment.clientId}`;
      paymentMap[key] = (paymentMap[key] || 0) + payment.amount;
    });
    
    // Process trips to find clients with no payments
    const clientReportMap = {};
    
    trips.forEach(trip => {
      if (!trip.vehicleId) return;
      
      trip.clients.forEach(clientInTrip => {
        if (!clientInTrip.clientId) return;
        
        const clientId = clientInTrip.clientId._id.toString();
        const tripId = trip._id.toString();
        const key = `${tripId}_${clientId}`;
        
        // Check if this client made any payment for this trip
        const totalPayments = paymentMap[key] || 0;
        
        // Only include if no payments made
        if (totalPayments === 0) {
          const clientName = clientInTrip.clientId.fullName || clientInTrip.clientId.companyName || 'Unknown';
          const vehicleNumber = trip.vehicleId.vehicleNumber;
          const reportKey = `${clientId}_${vehicleNumber}`;
          
          if (!clientReportMap[reportKey]) {
            clientReportMap[reportKey] = {
              clientId,
              clientName,
              vehicleNumber,
              pendingTripCount: 0,
              pendingBalance: 0,
              trips: []
            };
          }
          
          clientReportMap[reportKey].pendingTripCount += 1;
          clientReportMap[reportKey].pendingBalance += clientInTrip.clientRate || 0;
          clientReportMap[reportKey].trips.push({
            tripNumber: trip.tripNumber,
            tripId: trip._id,
            clientRate: clientInTrip.clientRate || 0
          });
        }
      });
    });
    
    // Convert map to array and sort by client name
    const reportData = Object.values(clientReportMap).sort((a, b) => 
      a.clientName.localeCompare(b.clientName)
    );
    
    // Calculate totals
    const totals = {
      totalClients: reportData.length,
      totalTripsWithPending: reportData.reduce((sum, item) => sum + item.pendingTripCount, 0),
      grandTotalPending: reportData.reduce((sum, item) => sum + item.pendingBalance, 0)
    };
    
    res.status(200).json({
      success: true,
      data: {
        clients: reportData,
        summary: totals
      }
    });
  } catch (error) {
    console.error('Error fetching client payment report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get client pending payment report
 * @route   GET /api/reports/client-pending
 * @access  Private (owner, manager, admin)
 */
exports.getClientPendingReport = async (req, res) => {
  try {
    const ClientPayment = require('../models/ClientPayment');
    const ClientExpense = require('../models/ClientExpense');
    const Vehicle = require('../models/Vehicle');
    
    // Get all active trips with client details
    const trips = await Trip.find({ isActive: true })
      .populate('vehicleId', 'vehicleNumber')
      .populate('clients.clientId', 'fullName companyName')
      .lean();
    
    // Group by client and calculate pending amounts
    const clientPendingMap = new Map();
    
    for (const trip of trips) {
      for (const client of trip.clients) {
        const clientId = client.clientId?._id?.toString();
        if (!clientId) continue;
        
        const clientName = client.clientId?.fullName || client.clientId?.companyName || 'Unknown';
        const vehicleNumber = trip.vehicleId?.vehicleNumber || 'N/A';
        
        // Calculate total amount due for this client in this trip
        const clientRate = client.clientRate || 0;
        
        // Get client expenses for this trip
        const clientExpenses = await ClientExpense.find({
          tripId: trip._id,
          clientId: clientId,
          isActive: true
        }).lean();
        
        const totalExpenses = clientExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        // Get client payments for this trip
        const clientPayments = await ClientPayment.find({
          tripId: trip._id,
          clientId: clientId,
          isActive: true
        }).lean();
        
        const totalPayments = clientPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
        
        // Total due = Client Rate + Expenses
        const totalDue = clientRate + totalExpenses;
        const pendingBalance = totalDue - totalPayments;
        
        // Only include if there's a pending balance AND client has made ZERO payments
        if (pendingBalance > 0 && totalPayments === 0) {
          if (!clientPendingMap.has(clientId)) {
            clientPendingMap.set(clientId, {
              clientId,
              clientName,
              trips: [],
              totalPendingCount: 0,
              totalPendingAmount: 0
            });
          }
          
          const clientData = clientPendingMap.get(clientId);
          clientData.trips.push({
            tripId: trip._id,
            tripNumber: trip.tripNumber,
            vehicleNumber,
            pendingBalance
          });
          clientData.totalPendingCount += 1;
          clientData.totalPendingAmount += pendingBalance;
        }
      }
    }
    
    // Convert map to array and sort by pending amount (highest first)
    const clientPendingData = Array.from(clientPendingMap.values())
      .sort((a, b) => b.totalPendingAmount - a.totalPendingAmount);
    
    // Calculate grand total
    const grandTotal = clientPendingData.reduce((sum, client) => sum + client.totalPendingAmount, 0);
    const totalTripsCount = clientPendingData.reduce((sum, client) => sum + client.totalPendingCount, 0);
    
    res.status(200).json({
      success: true,
      data: {
        clients: clientPendingData,
        summary: {
          totalClients: clientPendingData.length,
          totalTripsWithPending: totalTripsCount,
          grandTotalPending: grandTotal
        }
      }
    });
  } catch (error) {
    console.error('Error fetching client pending report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get fleet owner pending payment report
 * @route   GET /api/reports/fleet-pending
 * @access  Private (owner, manager, admin)
 */
exports.getFleetPendingReport = async (req, res) => {
  try {
    const TripAdvance = require('../models/TripAdvance');
    const TripExpense = require('../models/TripExpense');
    const Vehicle = require('../models/Vehicle');
    const FleetOwner = require('../models/FleetOwner');
    
    // Get all active trips with fleet-owned vehicles
    const trips = await Trip.find({ isActive: true })
      .populate({
        path: 'vehicleId',
        match: { ownershipType: 'fleet_owner' },
        populate: {
          path: 'fleetOwnerId',
          select: 'fullName companyName'
        }
      })
      .lean();
    
    // Filter out trips without fleet vehicles
    const fleetTrips = trips.filter(trip => trip.vehicleId !== null);
    
    // Group by fleet owner and calculate pending amounts
    const fleetPendingMap = new Map();
    
    for (const trip of fleetTrips) {
      const fleetOwnerId = trip.vehicleId?.fleetOwnerId?._id?.toString();
      if (!fleetOwnerId) continue;
      
      const fleetOwnerName = trip.vehicleId.fleetOwnerId?.fullName || trip.vehicleId.fleetOwnerId?.companyName || 'Unknown';
      const vehicleNumber = trip.vehicleId?.vehicleNumber || 'N/A';
      
      // Calculate total hire cost for this trip
      const totalHireCost = trip.clients.reduce((sum, client) => sum + (client.truckHireCost || 0), 0);
      
      // Get advances paid to fleet owner for this trip
      const advances = await TripAdvance.find({
        tripId: trip._id,
        isActive: true
      }).lean();
      
      const totalAdvances = advances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
      
      // Get expenses paid for this trip
      const expenses = await TripExpense.find({
        tripId: trip._id,
        isActive: true
      }).lean();
      
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      
      // Get commission
      let commission = trip.commissionAmount || 0;
      if (trip.commissionType === 'to_fleet_owner') {
        commission = -commission; // Negative means we owe more to fleet owner
      }
      
      // Get POD balance
      const podBalance = trip.podBalance || 0;
      
      // Formula: (Hire + Expenses) - Commission - POD - Advances
      const totalAmount = totalHireCost + totalExpenses;
      const pendingBalance = totalAmount - commission - podBalance - totalAdvances;
      
      // Only include if there's a pending balance > 0
      if (pendingBalance > 0) {
        if (!fleetPendingMap.has(fleetOwnerId)) {
          fleetPendingMap.set(fleetOwnerId, {
            fleetOwnerId,
            fleetOwnerName,
            trips: [],
            totalPendingCount: 0,
            totalPendingAmount: 0
          });
        }
        
        const fleetData = fleetPendingMap.get(fleetOwnerId);
        fleetData.trips.push({
          tripId: trip._id,
          tripNumber: trip.tripNumber,
          vehicleNumber,
          pendingBalance
        });
        fleetData.totalPendingCount += 1;
        fleetData.totalPendingAmount += pendingBalance;
      }
    }
    
    // Convert map to array and sort by pending amount (highest first)
    const fleetPendingData = Array.from(fleetPendingMap.values())
      .sort((a, b) => b.totalPendingAmount - a.totalPendingAmount);
    
    // Calculate grand total
    const grandTotal = fleetPendingData.reduce((sum, fleet) => sum + fleet.totalPendingAmount, 0);
    const totalTripsCount = fleetPendingData.reduce((sum, fleet) => sum + fleet.totalPendingCount, 0);
    
    res.status(200).json({
      success: true,
      data: {
        fleetOwners: fleetPendingData,
        summary: {
          totalFleetOwners: fleetPendingData.length,
          totalTripsWithPending: totalTripsCount,
          grandTotalPending: grandTotal
        }
      }
    });
  } catch (error) {
    console.error('Error fetching fleet pending report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
