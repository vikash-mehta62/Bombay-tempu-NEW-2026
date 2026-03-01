# Setup Instructions - Truck Management System

## Complete Setup Guide (Next.js + Node.js + MongoDB)

---

## Prerequisites

### Required Software:
1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** - Choose one:
   - Local: [Download MongoDB Community](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)
3. **Git** - [Download](https://git-scm.com/)
4. **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Check Installation:
```bash
node --version    # Should be v18 or higher
npm --version     # Should be 9 or higher
mongod --version  # If using local MongoDB
git --version
```

---

## Step 1: Backend Setup

### 1.1 Navigate to Backend Folder
```bash
cd backend
```

### 1.2 Install Dependencies
```bash
npm install
```

This will install:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- cors
- helmet
- multer
- exceljs
- and more...

### 1.3 Setup Environment Variables

Create `.env` file in backend folder:

```bash
# Copy from example
cp .env.example .env

# Or create manually
```

Edit `.env` file:

```env
NODE_ENV=development
PORT=5000

# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/truck_management

# OR For MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/truck_management

JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:3000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 1.4 Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
# or
brew services start mongodb-community
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster
4. Get connection string
5. Add to `.env` file

### 1.5 Create Admin User

Start MongoDB shell:
```bash
mongosh
```

Run these commands:
```javascript
use truck_management

// Create admin user (password: admin123)
db.users.insertOne({
  username: "admin",
  password: "$2a$10$YourHashedPasswordHere", // See note below
  fullName: "Admin User",
  email: "admin@example.com",
  phone: "9876543210",
  role: "owner",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Note:** To hash password, use this Node.js script:
```javascript
// hashPassword.js
const bcrypt = require('bcryptjs');
const password = 'admin123';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

Run: `node hashPassword.js`

### 1.6 Start Backend Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
╔═══════════════════════════════════════════════════════╗
║   🚚 Truck Management System API                     ║
║   Server running in development mode                  ║
║   Port: 5000                                          ║
╚═══════════════════════════════════════════════════════╝
```

Test API: http://localhost:5000

---

## Step 2: Frontend Setup (Next.js)

### 2.1 Create Next.js App

```bash
# Go back to project root
cd ..

# Create Next.js app
npx create-next-app@latest frontend

# When prompted, choose:
✔ Would you like to use TypeScript? No
✔ Would you like to use ESLint? Yes
✔ Would you like to use Tailwind CSS? Yes
✔ Would you like to use `src/` directory? No
✔ Would you like to use App Router? Yes
✔ Would you like to customize the default import alias? No
```

### 2.2 Navigate to Frontend
```bash
cd frontend
```

### 2.3 Install Additional Dependencies

```bash
npm install axios react-hook-form zod @tanstack/react-query
npm install recharts date-fns lucide-react
npm install clsx tailwind-merge class-variance-authority
```

### 2.4 Setup Environment Variables

Create `.env.local` file in frontend folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Truck Management System
```

### 2.5 Start Frontend

```bash
npm run dev
```

Frontend will run on: http://localhost:3000

---

## Step 3: Test the System

### 3.1 Test Backend API

**Test Health Check:**
```bash
curl http://localhost:5000/health
```

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

You should get a response with token:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "...",
    "username": "admin",
    "fullName": "Admin User",
    "role": "owner"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Test Protected Route (with token):**
```bash
curl http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3.2 Test Activity Logs

After login, check logs:
```bash
curl http://localhost:5000/api/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

You should see login activity logged.

---

## Step 4: Development Workflow

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Or Use Concurrently (Optional)

Install in project root:
```bash
npm install concurrently --save-dev
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\"",
    "backend": "cd backend && npm run dev",
    "frontend": "cd frontend && npm run dev"
  }
}
```

Then run:
```bash
npm run dev
```

---

## Step 5: Next Steps

### Backend:
1. ✅ Authentication working
2. ✅ Activity logging working
3. ✅ Vehicle CRUD working
4. ⏳ Add Driver model and routes
5. ⏳ Add Client model and routes
6. ⏳ Add Trip model and routes
7. ⏳ Add Expense model and routes
8. ⏳ Add Invoice model and routes

### Frontend:
1. ⏳ Create login page
2. ⏳ Create dashboard
3. ⏳ Create vehicle pages
4. ⏳ Create driver pages
5. ⏳ Create trip pages
6. ⏳ Create activity logs page
7. ⏳ Add charts and reports

---

## Common Issues & Solutions

### Issue 1: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
- Make sure MongoDB is running: `mongod`
- Check MongoDB URI in `.env`
- For Atlas, check network access and whitelist your IP

### Issue 2: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

### Issue 3: CORS Error in Frontend
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- Check `FRONTEND_URL` in backend `.env`
- Make sure CORS is configured in `server.js`

### Issue 4: JWT Token Invalid
```
Error: Invalid token
```

**Solution:**
- Check if token is being sent in Authorization header
- Check if JWT_SECRET matches in `.env`
- Token might be expired, login again

---

## Useful Commands

### MongoDB Commands
```bash
# Start MongoDB
mongod

# MongoDB Shell
mongosh

# Show databases
show dbs

# Use database
use truck_management

# Show collections
show collections

# Find all users
db.users.find()

# Find all logs
db.activitylogs.find().sort({timestamp: -1}).limit(10)

# Delete all logs
db.activitylogs.deleteMany({})
```

### Git Commands
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
```

### NPM Commands
```bash
# Install dependencies
npm install

# Install specific package
npm install package-name

# Uninstall package
npm uninstall package-name

# Update packages
npm update

# Check outdated packages
npm outdated
```

---

## Project Structure

```
truck-management-system/
│
├── backend/                    # Express API
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── frontend/                   # Next.js App
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── .env.local
│   ├── package.json
│   └── next.config.js
│
└── README.md
```

---

## Resources

- **Node.js**: https://nodejs.org/docs
- **Express**: https://expressjs.com
- **MongoDB**: https://www.mongodb.com/docs
- **Mongoose**: https://mongoosejs.com/docs
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Support

If you face any issues:
1. Check error messages carefully
2. Check console logs (backend terminal)
3. Check browser console (frontend)
4. Google the error message
5. Check MongoDB connection
6. Verify environment variables

---

**Happy Coding! 🚀**

