const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');
const Driver = require('./models/Driver');
const Vehicle = require('./models/Vehicle');

async function fixDriverVehicleStatus() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all active trips that are scheduled or in_progress
    const activeTrips = await Trip.find({
      isActive: true,
      status: { $in: ['scheduled', 'in_progress'] }
    }).populate('driverId vehicleId');

    console.log(`Found ${activeTrips.length} active trips (scheduled/in_progress)`);

    let driversUpdated = 0;
    let vehiclesUpdated = 0;

    for (const trip of activeTrips) {
      console.log(`\nProcessing Trip: ${trip.tripNumber} (Status: ${trip.status})`);

      // Update driver status to "on_trip"
      if (trip.driverId) {
        const driver = await Driver.findById(trip.driverId._id);
        if (driver && driver.status !== 'on_trip') {
          driver.status = 'on_trip';
          driver.currentVehicle = trip.vehicleId?._id || null;
          await driver.save();
          console.log(`  ✓ Updated driver ${driver.fullName} to on_trip`);
          driversUpdated++;
        } else if (driver && driver.status === 'on_trip') {
          console.log(`  - Driver ${driver.fullName} already on_trip`);
        }
      }

      // Update vehicle status to "on_trip"
      if (trip.vehicleId) {
        const vehicle = await Vehicle.findById(trip.vehicleId._id);
        if (vehicle && vehicle.currentStatus !== 'on_trip') {
          vehicle.currentStatus = 'on_trip';
          await vehicle.save();
          console.log(`  ✓ Updated vehicle ${vehicle.vehicleNumber} to on_trip`);
          vehiclesUpdated++;
        } else if (vehicle && vehicle.currentStatus === 'on_trip') {
          console.log(`  - Vehicle ${vehicle.vehicleNumber} already on_trip`);
        }
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total active trips processed: ${activeTrips.length}`);
    console.log(`Drivers updated: ${driversUpdated}`);
    console.log(`Vehicles updated: ${vehiclesUpdated}`);

    // Now check for drivers/vehicles that are marked on_trip but have no active trip
    console.log('\n=== Checking for orphaned on_trip status ===');

    const onTripDrivers = await Driver.find({ status: 'on_trip' });
    console.log(`Found ${onTripDrivers.length} drivers with on_trip status`);

    let orphanedDrivers = 0;
    for (const driver of onTripDrivers) {
      const hasActiveTrip = await Trip.findOne({
        driverId: driver._id,
        isActive: true,
        status: { $in: ['scheduled', 'in_progress'] }
      });

      if (!hasActiveTrip) {
        driver.status = 'available';
        driver.currentVehicle = null;
        await driver.save();
        console.log(`  ✓ Released driver ${driver.fullName} (no active trip found)`);
        orphanedDrivers++;
      }
    }

    const onTripVehicles = await Vehicle.find({ currentStatus: 'on_trip' });
    console.log(`Found ${onTripVehicles.length} vehicles with on_trip status`);

    let orphanedVehicles = 0;
    for (const vehicle of onTripVehicles) {
      const hasActiveTrip = await Trip.findOne({
        vehicleId: vehicle._id,
        isActive: true,
        status: { $in: ['scheduled', 'in_progress'] }
      });

      if (!hasActiveTrip) {
        vehicle.currentStatus = 'available';
        await vehicle.save();
        console.log(`  ✓ Released vehicle ${vehicle.vehicleNumber} (no active trip found)`);
        orphanedVehicles++;
      }
    }

    console.log(`\nOrphaned drivers released: ${orphanedDrivers}`);
    console.log(`Orphaned vehicles released: ${orphanedVehicles}`);

    console.log('\n✅ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing driver/vehicle status:', error);
    process.exit(1);
  }
}

fixDriverVehicleStatus();
