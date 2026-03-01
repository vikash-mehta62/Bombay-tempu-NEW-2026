# Quick Start Guide - Truck Management System

## शुरुआत करने के लिए Step-by-Step Guide

---

## Step 1: Requirements Check करें

### Software Requirements:
- **Node.js** (v18 या higher) - [Download](https://nodejs.org/)
- **PostgreSQL** या **MySQL** database - [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Check Installation:
```bash
node --version        # v18.0.0 या higher
npm --version         # 9.0.0 या higher
git --version         # 2.0.0 या higher
psql --version        # 14.0 या higher
```

---

## Step 2: Project Setup

### Backend Setup

```bash
# Create project folder
mkdir truck-management-system
cd truck-management-system

# Create backend folder
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express pg sequelize bcryptjs jsonwebtoken dotenv cors multer
npm install nodemon --save-dev

# Create folder structure
mkdir config controllers models routes middleware utils uploads
```

### Create server.js
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Truck Management API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Create .env file
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=truck_management
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

### Update package.json scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Test backend
```bash
npm run dev
# Visit: http://localhost:5000
```

---

### Frontend Setup

```bash
# Go back to project root
cd ..

# Create React app with Vite
npm create vite@latest frontend -- --template react
cd frontend

# Install dependencies
npm install
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled
npm install recharts react-hook-form

# Start development server
npm run dev
# Visit: http://localhost:5173
```

---

## Step 3: Database Setup

### Create Database (PostgreSQL)

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE truck_management;

# Connect to database
\c truck_management

# Exit
\q
```

### Create Tables (Run this SQL)

```sql
-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    capacity_tons DECIMAL(10,2),
    current_status VARCHAR(20) DEFAULT 'available',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE drivers (
    driver_id SERIAL PRIMARY KEY,
    driver_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry_date DATE,
    current_status VARCHAR(20) DEFAULT 'available',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    client_name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    gstin VARCHAR(15),
    credit_days INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table
CREATE TABLE trips (
    trip_id SERIAL PRIMARY KEY,
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT REFERENCES clients(client_id),
    vehicle_id INT REFERENCES vehicles(vehicle_id),
    driver_id INT REFERENCES drivers(driver_id),
    origin VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    trip_date DATE NOT NULL,
    freight_amount DECIMAL(12,2) NOT NULL,
    trip_status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE expenses (
    expense_id SERIAL PRIMARY KEY,
    expense_date DATE NOT NULL,
    expense_category VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    vehicle_id INT REFERENCES vehicles(vehicle_id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Insert Sample Data

```sql
-- Insert admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, role) 
VALUES ('admin', '$2a$10$XQKvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv', 'Admin User', 'owner');

-- Insert sample vehicle
INSERT INTO vehicles (vehicle_number, vehicle_type, make, model, capacity_tons) 
VALUES ('MH12AB1234', 'truck', 'Tata', 'LPT 1613', 16.0);

-- Insert sample driver
INSERT INTO drivers (driver_name, phone, license_number, license_expiry_date) 
VALUES ('Ramesh Kumar', '9876543210', 'MH1234567890', '2026-12-31');

-- Insert sample client
INSERT INTO clients (client_name, phone, email) 
VALUES ('ABC Transport Ltd', '9876543211', 'abc@transport.com');
```

---

## Step 4: Create Basic API

### config/database.js
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  }
);

module.exports = sequelize;
```

### models/Vehicle.js
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  vehicle_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  vehicle_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  make: DataTypes.STRING(50),
  model: DataTypes.STRING(50),
  capacity_tons: DataTypes.DECIMAL(10, 2),
  current_status: {
    type: DataTypes.STRING(20),
    defaultValue: 'available'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'vehicles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Vehicle;
```

### controllers/vehicleController.js
```javascript
const Vehicle = require('../models/Vehicle');

// Get all vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { is_active: true }
    });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create vehicle
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    await vehicle.update(req.body);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    await vehicle.update({ is_active: false });
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### routes/vehicles.js
```javascript
const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/', vehicleController.getAllVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
```

### Update server.js
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/vehicles', require('./routes/vehicles'));

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.log('Error: ' + err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Step 5: Test API

### Using Postman or curl

```bash
# Get all vehicles
curl http://localhost:5000/api/vehicles

# Get vehicle by ID
curl http://localhost:5000/api/vehicles/1

# Create vehicle
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_number": "MH12CD5678",
    "vehicle_type": "truck",
    "make": "Ashok Leyland",
    "model": "Dost",
    "capacity_tons": 2.5
  }'

# Update vehicle
curl -X PUT http://localhost:5000/api/vehicles/1 \
  -H "Content-Type: application/json" \
  -d '{"current_status": "on_trip"}'

# Delete vehicle
curl -X DELETE http://localhost:5000/api/vehicles/1
```

---

## Step 6: Create Basic Frontend

### src/services/api.js
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
```

### src/services/vehicleService.js
```javascript
import api from './api';

export const vehicleService = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`)
};
```

### src/pages/VehicleList.jsx
```javascript
import { useState, useEffect } from 'react';
import { vehicleService } from '../services/vehicleService';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await vehicleService.getAll();
      setVehicles(response.data.data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Vehicles</h1>
      <table>
        <thead>
          <tr>
            <th>Vehicle Number</th>
            <th>Type</th>
            <th>Make</th>
            <th>Model</th>
            <th>Capacity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map(vehicle => (
            <tr key={vehicle.vehicle_id}>
              <td>{vehicle.vehicle_number}</td>
              <td>{vehicle.vehicle_type}</td>
              <td>{vehicle.make}</td>
              <td>{vehicle.model}</td>
              <td>{vehicle.capacity_tons} tons</td>
              <td>{vehicle.current_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VehicleList;
```

---

## Step 7: Next Steps

### अब आप ये कर सकते हैं:

1. **Similarly create other modules:**
   - Drivers (same pattern as vehicles)
   - Clients
   - Trips
   - Expenses

2. **Add Authentication:**
   - JWT login/logout
   - Protected routes
   - Role-based access

3. **Improve UI:**
   - Add Material-UI components
   - Create forms
   - Add charts

4. **Add Features:**
   - File upload
   - PDF generation
   - Email notifications
   - Reports

---

## Common Commands

```bash
# Backend
cd backend
npm run dev              # Start development server
npm start                # Start production server

# Frontend
cd frontend
npm run dev              # Start development server
npm run build            # Build for production

# Database
psql -U postgres         # Login to PostgreSQL
\l                       # List databases
\c truck_management      # Connect to database
\dt                      # List tables
\d vehicles              # Describe table
```

---

## Troubleshooting

### Database connection error:
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start
```

### Port already in use:
```bash
# Kill process on port 5000
npx kill-port 5000

# Or change port in .env
PORT=5001
```

### CORS error:
```javascript
// In server.js, add:
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## Resources

- **Node.js Docs**: https://nodejs.org/docs
- **Express.js**: https://expressjs.com
- **React**: https://react.dev
- **Sequelize**: https://sequelize.org
- **PostgreSQL**: https://www.postgresql.org/docs

---

## Need Help?

- Check error messages carefully
- Use console.log() for debugging
- Check browser console for frontend errors
- Check terminal for backend errors
- Google the error message
- Ask on Stack Overflow

