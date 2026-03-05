const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Driver = require('./models/Driver');
const FleetOwner = require('./models/FleetOwner');
const Client = require('./models/Client');

async function hashExistingPasswords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Hash Driver passwords
    const drivers = await Driver.find({});
    console.log(`\nFound ${drivers.length} drivers`);
    
    for (const driver of drivers) {
      if (driver.password && driver.password.length < 60) {
        // Password is not hashed (bcrypt hash is 60 chars)
        const salt = await bcrypt.genSalt(10);
        driver.password = await bcrypt.hash(driver.password, salt);
        await driver.save({ validateBeforeSave: false });
        console.log(`✓ Hashed password for driver: ${driver.fullName}`);
      }
    }

    // Hash Fleet Owner passwords
    const fleetOwners = await FleetOwner.find({}).select('+password');
    console.log(`\nFound ${fleetOwners.length} fleet owners`);
    
    for (const owner of fleetOwners) {
      if (owner.password && owner.password.length < 60) {
        const salt = await bcrypt.genSalt(10);
        owner.password = await bcrypt.hash(owner.password, salt);
        await owner.save({ validateBeforeSave: false });
        console.log(`✓ Hashed password for fleet owner: ${owner.fullName}`);
      }
    }

    // Hash Client passwords
    const clients = await Client.find({});
    console.log(`\nFound ${clients.length} clients`);
    
    for (const client of clients) {
      if (client.password && client.password.length < 60) {
        const salt = await bcrypt.genSalt(10);
        client.password = await bcrypt.hash(client.password, salt);
        await client.save({ validateBeforeSave: false });
        console.log(`✓ Hashed password for client: ${client.fullName}`);
      }
    }

    console.log('\n✅ All passwords hashed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

hashExistingPasswords();
