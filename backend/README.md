# Truck Management System - Backend API

Backend API built with Node.js, Express, and MongoDB.

## Features

- ✅ JWT Authentication
- ✅ Role-based Access Control
- ✅ Activity Logging (tracks all user actions)
- ✅ MongoDB with Mongoose
- ✅ File Upload support
- ✅ Rate Limiting
- ✅ Security Headers (Helmet)
- ✅ CORS enabled
- ✅ Excel Export for logs

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env` file:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/truck_management
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
```

### 4. Run Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/change-password` - Change password

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `PATCH /api/vehicles/:id/status` - Update vehicle status
- `GET /api/vehicles/stats` - Get vehicle statistics

### Activity Logs
- `GET /api/logs` - Get all logs (with filters)
- `GET /api/logs/recent` - Get recent logs
- `GET /api/logs/stats` - Get log statistics
- `GET /api/logs/export` - Export logs to Excel
- `GET /api/logs/user/:userId` - Get logs by user
- `GET /api/logs/module/:module` - Get logs by module
- `DELETE /api/logs/cleanup` - Delete old logs

## Activity Logging

The system automatically logs:
- User login/logout
- Create, Read, Update, Delete operations
- Status changes
- Report exports
- All user actions with timestamp, IP, and user agent

### Log Structure
```javascript
{
  userId: ObjectId,
  userName: "John Doe",
  userRole: "manager",
  action: "Created new vehicle",
  actionType: "CREATE",
  module: "vehicles",
  entityId: ObjectId,
  details: { vehicleNumber: "MH12AB1234" },
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  timestamp: Date
}
```

## User Roles

- **owner** - Full access
- **manager** - Operations management
- **accountant** - Financial operations
- **dispatcher** - Trip management
- **viewer** - Read-only access

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration
- Input validation
- Role-based access control

## Testing

### Create Admin User

```bash
# Using MongoDB shell
mongosh

use truck_management

db.users.insertOne({
  username: "admin",
  password: "$2a$10$...", // Use bcrypt to hash "admin123"
  fullName: "Admin User",
  email: "admin@example.com",
  role: "owner",
  isActive: true,
  createdAt: new Date()
})
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Project Structure

```
backend/
├── config/
│   └── database.js
├── controllers/
│   ├── authController.js
│   ├── vehicleController.js
│   └── logController.js
├── middleware/
│   ├── auth.js
│   └── activityLogger.js
├── models/
│   ├── User.js
│   ├── Vehicle.js
│   └── ActivityLog.js
├── routes/
│   ├── auth.js
│   ├── vehicles.js
│   └── logs.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

## Next Steps

1. Add more models (Driver, Client, Trip, Expense, etc.)
2. Add more controllers and routes
3. Implement file upload with Cloudinary
4. Add email notifications
5. Add PDF generation
6. Add more reports

## License

MIT
