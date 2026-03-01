const mongoose = require('mongoose');
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
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

async function updateAdminRole() {
  try {
    // Update admin user role from 'owner' to 'admin'
    const result = await User.updateOne(
      { username: 'admin' },
      { $set: { role: 'admin' } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Admin user role updated successfully!');
      console.log('Role changed: owner → admin');
    } else {
      console.log('⚠️  No changes made. User might already have admin role.');
    }

    // Verify
    const admin = await User.findOne({ username: 'admin' });
    console.log('');
    console.log('Current Admin Details:');
    console.log('=====================');
    console.log('Username:', admin.username);
    console.log('Role:', admin.role);
    console.log('Active:', admin.isActive);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    process.exit(1);
  }
}

updateAdminRole();
