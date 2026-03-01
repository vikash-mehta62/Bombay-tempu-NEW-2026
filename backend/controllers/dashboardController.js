const Trip = require('../models/Trip');
const TripExpense = require('../models/TripExpense');
const TripAdvance = require('../models/TripAdvance');
const ClientExpense = require('../models/ClientExpense');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Client = require('../models/Client');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get all active trips (isActive: true only)
    const trips = await Trip.find({ isActive: true });
    
    // Calculate trip statistics
    const totalTrips = trips.length;
    const inProgressTrips = trips.filter(t => t.status === 'in_progress').length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    
    // Calculate revenue and profit from all active trips
    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.totalClientRevenue || 0), 0);
    const totalProfit = trips.reduce((sum, trip) => sum + (trip.profitLoss || 0), 0);
    
    // Get expenses for all active trips (isActive: true)
    const tripIds = trips.map(t => t._id);
    
    const [tripExpenses, tripAdvances, clientExpenses] = await Promise.all([
      TripExpense.find({ tripId: { $in: tripIds }, isActive: true }),
      TripAdvance.find({ tripId: { $in: tripIds }, isActive: true }),
      ClientExpense.find({ tripId: { $in: tripIds }, isActive: true })
    ]);
    
    // Calculate total expenses from all active trips
    const totalTripExpenses = tripExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalTripAdvances = tripAdvances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
    const totalClientExpenses = clientExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalExpenses = totalTripExpenses + totalClientExpenses;
    
    // Get vehicle, driver, and client counts
    const [totalVehicles, totalDrivers, totalClients] = await Promise.all([
      Vehicle.countDocuments({ isActive: true }),
      Driver.countDocuments({ isActive: true }),
      Client.countDocuments({ isActive: true })
    ]);
    
    // Get vehicle status breakdown
    const vehiclesByStatus = await Vehicle.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get trip status breakdown
    const tripsByStatus = await Trip.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalClientRevenue' },
          profit: { $sum: '$profitLoss' }
        }
      }
    ]);
    
    // Calculate monthly revenue (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyTrips = await Trip.find({
      isActive: true,
      loadDate: { $gte: startOfMonth }
    });
    
    const monthlyRevenue = monthlyTrips.reduce((sum, trip) => sum + (trip.totalClientRevenue || 0), 0);
    const monthlyProfit = monthlyTrips.reduce((sum, trip) => sum + (trip.profitLoss || 0), 0);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalTrips,
          inProgressTrips,
          completedTrips,
          totalVehicles,
          totalDrivers,
          totalClients,
          totalRevenue,
          totalProfit,
          totalExpenses,
          totalTripExpenses,
          totalTripAdvances,
          totalClientExpenses,
          monthlyRevenue,
          monthlyProfit
        },
        vehiclesByStatus,
        tripsByStatus
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
