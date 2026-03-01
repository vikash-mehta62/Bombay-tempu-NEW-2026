const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  fullName: String,
  email: String,
  phone: String,
  role: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

async function updateAdmin() {
  try {
    // Hash new password
    const hashedPassword = await bcrypt.hash('33550011', 10);

    // Update or create admin user
    const admin = await User.findOneAndUpdate(
      { email: 'butsbwd@gmail.com' },
      {
        username: 'mohit',
        password: hashedPassword,
        fullName: 'Mohit Chodhary',
        email: 'butsbwd@gmail.com',
        phone: '9876543210',
        role: 'admin',
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('✅ Admin user updated successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('Username: mohit');
    console.log('Email: butsbwd@gmail.com');
    console.log('Password: 33550011');
    console.log('Full Name: Mohit Chodhary');
    console.log('Role: admin');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    process.exit(1);
  }
}

updateAdmin();
