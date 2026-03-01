# Quick Commands Reference

## 🚀 Quick Start Commands

### Initial Setup (One Time)

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your settings

# 3. Start MongoDB (if local)
mongod

# 4. Start backend server
npm run dev
```

### Daily Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (when ready)
cd frontend
npm run dev
```

---

## 📦 NPM Commands

### Backend
```bash
cd backend

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Install new package
npm install package-name

# Install dev dependency
npm install --save-dev package-name
```

### Frontend (when created)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🗄️ MongoDB Commands

### Start/Stop MongoDB

```bash
# Windows
mongod

# Linux
sudo systemctl start mongod
sudo systemctl stop mongod
sudo systemctl status mongod

# Mac
brew services start mongodb-community
brew services stop mongodb-community
```

### MongoDB Shell (mongosh)

```bash
# Start shell
mongosh

# Show databases
show dbs

# Use database
use truck_management

# Show collections
show collections

# Find all users
db.users.find().pretty()

# Find all activity logs
db.activitylogs.find().sort({timestamp: -1}).limit(10).pretty()

# Count documents
db.activitylogs.countDocuments()

# Delete all logs
db.activitylogs.deleteMany({})

# Delete logs older than 90 days
db.activitylogs.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})

# Create admin user
db.users.insertOne({
  username: "admin",
  password: "$2a$10$...", // Use hashed password
  fullName: "Admin User",
  email: "admin@example.com",
  phone: "9876543210",
  role: "owner",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

# Exit shell
exit
```

---

## 🔐 Hash Password (Node.js)

Create `hashPassword.js`:
```javascript
const bcrypt = require('bcryptjs');
const password = process.argv[2] || 'admin123';
bcrypt.hash(password, 10).then(hash => {
  console.log('Password:', password);
  console.log('Hash:', hash);
});
```

Run:
```bash
node hashPassword.js admin123
```

---

## 🧪 API Testing with cURL

### Authentication

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "fullName": "Test User",
    "email": "test@example.com",
    "role": "manager"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Get current user (replace TOKEN)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Vehicles

```bash
# Get all vehicles
curl http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get vehicle by ID
curl http://localhost:5000/api/vehicles/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create vehicle
curl -X POST http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "MH12AB1234",
    "vehicleType": "truck",
    "make": "Tata",
    "model": "LPT 1613",
    "capacityTons": 16,
    "fuelType": "diesel"
  }'

# Update vehicle
curl -X PUT http://localhost:5000/api/vehicles/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentStatus": "on_trip"
  }'

# Delete vehicle
curl -X DELETE http://localhost:5000/api/vehicles/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get vehicle stats
curl http://localhost:5000/api/vehicles/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Activity Logs

```bash
# Get all logs
curl http://localhost:5000/api/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get recent logs
curl http://localhost:5000/api/logs/recent \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get logs with filters
curl "http://localhost:5000/api/logs?module=vehicles&actionType=CREATE&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get log statistics
curl http://localhost:5000/api/logs/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Export logs to Excel
curl http://localhost:5000/api/logs/export \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --output logs.xlsx

# Get logs by user
curl http://localhost:5000/api/logs/user/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get logs by module
curl http://localhost:5000/api/logs/module/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Cleanup old logs (90 days)
curl -X DELETE "http://localhost:5000/api/logs/cleanup?days=90" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🐛 Debugging Commands

### Check if port is in use

```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -ti:5000
```

### Kill process on port

```bash
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
# or
lsof -ti:5000 | xargs kill -9
```

### Check MongoDB status

```bash
# Linux
sudo systemctl status mongod

# Mac
brew services list

# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"
```

### View logs

```bash
# Backend logs (if using PM2)
pm2 logs

# MongoDB logs (Linux)
sudo tail -f /var/log/mongodb/mongod.log

# MongoDB logs (Mac)
tail -f /usr/local/var/log/mongodb/mongo.log
```

---

## 🔄 Git Commands

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "uploads/" >> .gitignore

# Create branch
git checkout -b feature/new-feature

# Push to remote
git remote add origin <repository-url>
git push -u origin main
```

---

## 📊 Database Backup & Restore

### Backup

```bash
# Backup entire database
mongodump --db truck_management --out ./backup

# Backup specific collection
mongodump --db truck_management --collection users --out ./backup

# Backup with compression
mongodump --db truck_management --gzip --out ./backup
```

### Restore

```bash
# Restore entire database
mongorestore --db truck_management ./backup/truck_management

# Restore specific collection
mongorestore --db truck_management --collection users ./backup/truck_management/users.bson

# Restore from compressed backup
mongorestore --gzip --db truck_management ./backup/truck_management
```

---

## 🚀 Production Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
cd backend
pm2 start server.js --name truck-management

# View logs
pm2 logs truck-management

# Restart
pm2 restart truck-management

# Stop
pm2 stop truck-management

# Delete
pm2 delete truck-management

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Environment Variables for Production

```bash
# Set production environment
export NODE_ENV=production

# Or in .env
NODE_ENV=production
```

---

## 📝 Useful Aliases (Optional)

Add to `.bashrc` or `.zshrc`:

```bash
# Backend
alias backend="cd ~/truck-management-system/backend && npm run dev"

# Frontend
alias frontend="cd ~/truck-management-system/frontend && npm run dev"

# MongoDB
alias mongo-start="sudo systemctl start mongod"
alias mongo-stop="sudo systemctl stop mongod"
alias mongo-shell="mongosh"

# Logs
alias logs-backend="cd ~/truck-management-system/backend && tail -f logs/app.log"
```

---

## 🔍 Health Checks

```bash
# Check backend health
curl http://localhost:5000/health

# Check MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Check if backend is running
curl http://localhost:5000/

# Check API with authentication
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📦 Package Management

```bash
# Update all packages
npm update

# Check for outdated packages
npm outdated

# Install specific version
npm install package-name@1.2.3

# Uninstall package
npm uninstall package-name

# Clear npm cache
npm cache clean --force

# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Quick Test Script

Create `test.sh`:

```bash
#!/bin/bash

echo "Testing Truck Management API..."

# Test health
echo "1. Testing health endpoint..."
curl -s http://localhost:5000/health | jq

# Test login
echo "2. Testing login..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

echo "Token: $TOKEN"

# Test vehicles
echo "3. Testing vehicles endpoint..."
curl -s http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer $TOKEN" | jq

# Test logs
echo "4. Testing logs endpoint..."
curl -s http://localhost:5000/api/logs/recent \
  -H "Authorization: Bearer $TOKEN" | jq

echo "Tests completed!"
```

Run:
```bash
chmod +x test.sh
./test.sh
```

---

## 💡 Pro Tips

1. **Use environment variables** for sensitive data
2. **Always backup** before major changes
3. **Use PM2** for production deployment
4. **Monitor logs** regularly
5. **Clean old activity logs** periodically
6. **Use indexes** for better query performance
7. **Test APIs** with Postman or cURL
8. **Version control** everything except .env

---

**Save this file for quick reference! 📌**

