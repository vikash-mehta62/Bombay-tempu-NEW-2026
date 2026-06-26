const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Drop deprecated unique indexes to let mongoose rebuild them with partial filter expressions
    try {
      await mongoose.connection.collection('fleetowners').dropIndex('username_1_forCompany_1');
      console.log('✅ Dropped deprecated unique index username_1_forCompany_1 from fleetowners');
    } catch (e) {
      // Ignore if index doesn't exist
    }

    try {
      await mongoose.connection.collection('drivers').dropIndex('licenseNumber_1_forCompany_1');
      console.log('✅ Dropped deprecated unique index licenseNumber_1_forCompany_1 from drivers');
    } catch (e) {
      // Ignore if index doesn't exist
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
