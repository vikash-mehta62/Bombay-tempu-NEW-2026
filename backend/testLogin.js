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

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function testLogin() {
  try {
    console.log('\n🔍 Testing Login Functionality...\n');
    
    // Find user
    const user = await User.findOne({ username: 'mohit' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found with username: mohit');
      console.log('\n📋 Available users:');
      const allUsers = await User.find({}, 'username email fullName role isActive');
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.email}) - ${u.role} - Active: ${u.isActive}`);
      });
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.fullName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
    
    // Test password
    const testPassword = '33550011';
    console.log(`\n🔐 Testing password: ${testPassword}`);
    
    const isMatch = await user.comparePassword(testPassword);
    
    if (isMatch) {
      console.log('✅ Password matches! Login should work.');
    } else {
      console.log('❌ Password does not match!');
      console.log('\n🔧 Fixing password...');
      
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      await User.updateOne(
        { _id: user._id },
        { password: hashedPassword }
      );
      
      console.log('✅ Password updated successfully!');
    }
    
    console.log('\n✅ Login test complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLogin();
