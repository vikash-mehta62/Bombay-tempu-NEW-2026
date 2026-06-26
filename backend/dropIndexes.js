require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');

const run = async () => {
  await connectDB();

  console.log('Dropping existing indexes...');

  try {
    await mongoose.connection.collection('fleetowners').dropIndex('username_1_forCompany_1');
    console.log('✅ Dropped username_1_forCompany_1 from fleetowners');
  } catch (error) {
    if (error.code === 27 || error.message.includes('index not found')) {
      console.log('ℹ️ Index username_1_forCompany_1 does not exist in fleetowners');
    } else {
      console.error('❌ Error dropping index from fleetowners:', error.message);
    }
  }

  try {
    await mongoose.connection.collection('drivers').dropIndex('licenseNumber_1_forCompany_1');
    console.log('✅ Dropped licenseNumber_1_forCompany_1 from drivers');
  } catch (error) {
    if (error.code === 27 || error.message.includes('index not found')) {
      console.log('ℹ️ Index licenseNumber_1_forCompany_1 does not exist in drivers');
    } else {
      console.error('❌ Error dropping index from drivers:', error.message);
    }
  }

  console.log('All index modifications complete!');
  process.exit(0);
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
