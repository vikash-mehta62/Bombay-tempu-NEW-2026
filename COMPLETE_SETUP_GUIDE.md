# Complete Setup Guide - Truck Management System
## Next.js + Tailwind + Node.js + Express + MongoDB

---

## 🎯 What You're Building

A complete truck/fleet management system with:
- ✅ **Backend API** (Node.js + Express + MongoDB)
- ✅ **Frontend Web App** (Next.js + Tailwind CSS)
- ✅ **Activity Logging** (Automatic tracking of all user actions)
- ✅ **Authentication** (JWT-based login system)
- ✅ **Vehicle Management** (CRUD operations)
- ✅ **Dashboard** (Stats and analytics)

---

## 📋 Prerequisites

### Required Software:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Check: `node --version`

2. **MongoDB**
   - **Option A**: Local MongoDB
     - Download: https://www.mongodb.com/try/download/community
     - Check: `mongod --version`
   - **Option B**: MongoDB Atlas (Cloud - Free)
     - Sign up: https://www.mongodb.com/cloud/atlas

3. **Git** (optional but recommended)
   - Download: https://git-scm.com/
   - Check: `git --version`

4. **Code Editor**
   - VS Code (recommended): https://code.visualstudio.com/

---

## 🚀 Step-by-Step Setup

### STEP 1: Backend Setup

#### 1.1 Navigate to Backend Folder
```bash
cd backend
```

#### 1.2 Install Dependencies
```bash
npm install
```

This installs:
- express (web framework)
- mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- cors, helmet (security)
- exceljs (Excel export)
- and more...

#### 1.3 Create Environment File

Create `.env` file in `backend` folder:

```env
NODE_ENV=development
PORT=5000

# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/truck_management

# OR For MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/truck_management

JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:3000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important**: Change `JWT_SECRET` to a random string!

#### 1.4 Start MongoDB

**If using Local MongoDB:**
```bash
# Windows
mongod

# Linux
sudo systemctl start mongod

# Mac
brew services start mongodb-community
```

**If using MongoDB Atlas:**
1. Create account at mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to `.env` file

#### 1.5 Create Admin User

Start MongoDB shell:
```bash
mongosh
```

Run these commands:
```javascript
use truck_management

// Create admin user
db.users.insertOne({
  username: "admin",
  password: "$2a$10$YourHashedPasswordHere",
  fullName: "Admin User",
  email: "admin@example.com",
  phone: "9876543210",
  role: "owner",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

exit
```

**To hash password**, create `hashPassword.js`:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('admin123', 10).then(hash => console.log(hash));
```

Run: `node hashPassword.js`

Copy the hash and use it in the insertOne command above.

#### 1.6 Start Backend Server

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

#### 1.7 Test Backend

Open browser: http://localhost:5000

You should see:
```json
{
  "success": true,
  "message": "Truck Management System API",
  "version": "1.0.0"
}
```

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

You should get a token in response.

---

### STEP 2: Frontend Setup

#### 2.1 Open New Terminal

Keep backend running, open new terminal.

#### 2.2 Navigate to Frontend Folder
```bash
cd frontend
```

#### 2.3 Install Dependencies
```bash
npm install
```

This installs:
- next (React framework)
- react, react-dom
- tailwindcss (styling)
- axios (HTTP client)
- lucide-react (icons)
- sonner (notifications)
- and more...

#### 2.4 Create Environment File

Create `.env.local` file in `frontend` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Truck Management System
```

#### 2.5 Start Frontend Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

#### 2.6 Open in Browser

Go to: http://localhost:3000

You should see the login page!

---

### STEP 3: Login and Test

#### 3.1 Login

Use these credentials:
- **Username**: `admin`
- **Password**: `admin123`

Click "Sign In"

#### 3.2 Explore Dashboard

After login, you'll see:
- Dashboard with stats
- Sidebar with menu
- Recent activity

#### 3.3 Test Vehicle Management

1. Click "Vehicles" in sidebar
2. Click "Add Vehicle" button
3. Fill the form:
   - Vehicle Number: MH12AB1234
   - Type: truck
   - Make: Tata
   - Model: LPT 1613
   - Capacity: 16 tons
4. Click "Save"

#### 3.4 Check Activity Logs

1. Click "Activity Logs" in sidebar
2. You'll see all your actions logged:
   - Login
   - Created vehicle
   - Viewed pages
3. Try filters and export to Excel

---

## 🎉 Success! Your System is Running

You now have:
- ✅ Backend API running on http://localhost:5000
- ✅ Frontend app running on http://localhost:3000
- ✅ MongoDB database storing data
- ✅ Activity logging tracking everything
- ✅ Authentication working
- ✅ Vehicle management working

---

## 📁 Project Structure

```
truck-management-system/
│
├── backend/                    ✅ READY
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/                   ✅ READY
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── vehicles/
│   │   │   ├── logs/
│   │   │   └── page.js
│   │   ├── login/
│   │   ├── globals.css
│   │   └── layout.js
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── .env.local
│   ├── package.json
│   └── next.config.js
│
└── Documentation/
    ├── README.md
    ├── SETUP_INSTRUCTIONS.md
    ├── PROJECT_SUMMARY.md
    └── ... (more docs)
```

---

## 🔧 Daily Development Workflow

### Starting the System

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

### Stopping the System

Press `Ctrl + C` in both terminals.

---

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Check if MongoDB is running
mongosh

# If not, start it
mongod
```

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

# Or change port in backend/.env
PORT=5001
```

### Issue 3: Cannot Login

**Solution:**
1. Check if admin user exists:
```bash
mongosh
use truck_management
db.users.find()
```

2. If no user, create one (see Step 1.5)

3. Check password hash is correct

4. Check JWT_SECRET in backend/.env

### Issue 4: CORS Error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
1. Check `FRONTEND_URL` in backend/.env
2. Make sure it's `http://localhost:3000`
3. Restart backend server

### Issue 5: Module Not Found

```
Error: Cannot find module 'express'
```

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 What's Implemented

### Backend (100% Ready)
- ✅ Authentication (login, register, JWT)
- ✅ User management with roles
- ✅ Vehicle CRUD operations
- ✅ Activity logging (automatic)
- ✅ Security (rate limiting, helmet, CORS)
- ✅ Excel export for logs
- ✅ MongoDB models
- ✅ API routes with logging middleware

### Frontend (Core Features Ready)
- ✅ Login page
- ✅ Dashboard with stats
- ✅ Vehicle list and management
- ✅ Activity logs viewer
- ✅ Filters and search
- ✅ Excel export
- ✅ Responsive design
- ✅ Toast notifications

### To Be Added
- ⏳ Driver management pages
- ⏳ Client management pages
- ⏳ Trip management pages
- ⏳ Expense tracking pages
- ⏳ Invoice generation pages
- ⏳ Payment tracking pages
- ⏳ Reports with charts
- ⏳ Document upload

---

## 🎯 Next Steps

### 1. Add More Vehicles
- Go to Vehicles page
- Add 5-10 vehicles
- Try different statuses

### 2. Explore Activity Logs
- Check all your actions
- Try different filters
- Export to Excel

### 3. Add More Models (Backend)
Create models for:
- Driver
- Client
- Trip
- Expense
- Invoice

### 4. Add More Pages (Frontend)
Create pages for:
- Drivers
- Clients
- Trips
- Expenses
- Invoices

### 5. Customize
- Change colors in tailwind.config.js
- Add your company logo
- Modify dashboard stats
- Add more features

---

## 📚 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **MongoDB**: https://www.mongodb.com/docs
- **Express**: https://expressjs.com
- **React**: https://react.dev

---

## 💡 Pro Tips

1. **Keep both terminals open** while developing
2. **Check activity logs** to see what's being tracked
3. **Use MongoDB Compass** for visual database management
4. **Install React DevTools** browser extension
5. **Use Postman** to test API endpoints
6. **Backup your database** regularly
7. **Git commit** frequently

---

## 🔐 Security Notes

### For Development:
- Default credentials are fine
- JWT_SECRET can be simple
- CORS is open

### For Production:
- Change all default passwords
- Use strong JWT_SECRET (32+ characters)
- Restrict CORS to your domain
- Use HTTPS
- Enable rate limiting
- Regular backups
- Monitor activity logs

---

## 📞 Need Help?

### Check These First:
1. Are both servers running?
2. Is MongoDB running?
3. Are environment variables correct?
4. Did you create admin user?
5. Check browser console for errors
6. Check terminal for errors

### Debugging Steps:
1. Check backend logs (terminal 1)
2. Check frontend logs (terminal 2)
3. Check browser console (F12)
4. Check MongoDB data (mongosh)
5. Test API with curl/Postman

---

## 🎊 Congratulations!

You've successfully set up a complete truck management system with:
- Modern tech stack
- Activity logging
- Authentication
- Vehicle management
- Beautiful UI

**Happy Coding! 🚀**

