# Drivers Management Feature

## Overview
Complete driver management system with CRUD operations, status tracking, and license management.

## Features Implemented

### Backend (Node.js + Express + MongoDB)

#### 1. Driver Model (`backend/models/Driver.js`)
- **Basic Information**
  - Full Name (required)
  - Contact Number (required, unique)
  - Email (optional)
  - Address
  - Date of Birth 
  - Joining Date

- **License Information**
  - License Number (unique)
  - License Expiry Date

- **Emergency Contact**
  - Contact Name
  - Contact Phone
  - Relation

- **Status Management**
  - active
  - inactive
  - on_leave
  - terminated

- **Security**
  - Password (default: "12345678")
  - Bcrypt hashing for password security
  - Password comparison method

- **Vehicle Assignment**
  - Current Vehicle reference (optional)

#### 2. Driver Controller (`backend/controllers/driverController.js`)
- `getAllDrivers` - Get all drivers with search and status filters
- `getDriverById` - Get single driver details
- `createDriver` - Create new driver (auto-sets default password)
- `updateDriver` - Update driver information
- `deleteDriver` - Soft delete (sets isActive to false)
- `getDriverStats` - Get driver statistics by status

#### 3. Driver Routes (`backend/routes/drivers.js`)
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/stats` - Get driver statistics (admin only)
- `GET /api/drivers/:id` - Get driver by ID
- `POST /api/drivers` - Create new driver (admin only)
- `PUT /api/drivers/:id` - Update driver (admin only)
- `DELETE /api/drivers/:id` - Delete driver (admin only)

### Frontend (Next.js 14 + Tailwind CSS)

#### 1. Drivers Page (`frontend/app/dashboard/drivers/page.js`)
- **Statistics Dashboard**
  - Total Drivers count
  - Active drivers count
  - On Leave drivers count
  - Inactive/Terminated drivers count

- **Search & Filter**
  - Search by name, contact, or license number
  - Filter by status (active, on_leave, inactive, terminated)

- **Drivers Table**
  - Driver details with current vehicle
  - Contact information (phone & email)
  - License number and expiry date
  - Joining date
  - Status badge with color coding
  - Edit and Delete actions

#### 2. Driver Form Modal (`frontend/components/DriverFormModal.js`)
- **Add New Driver**
  - Info banner showing default password "12345678"
  - Full form with all driver fields
  - Validation for required fields

- **Edit Driver**
  - Pre-filled form with existing data
  - Update all driver information
  - Cannot change password through this form

- **Form Sections**
  1. Basic Information
     - Full Name (required)
     - Contact Number (required)
     - Email
     - Address
     - Date of Birth
     - Joining Date
     - Status dropdown

  2. License Information
     - License Number
     - License Expiry Date

  3. Emergency Contact
     - Contact Name
     - Contact Phone
     - Relation

#### 3. API Integration (`frontend/lib/api.js`)
```javascript
export const driverAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
  getStats: () => api.get('/drivers/stats'),
};
```

## Default Password
- All new drivers get default password: **12345678**
- Password is hashed using bcrypt before storing
- Drivers can change password after first login
- Password cannot be updated through the edit driver form

## Status Color Coding
- **Active**: Green badge
- **On Leave**: Yellow badge
- **Inactive**: Gray badge
- **Terminated**: Red badge

## Security Features
- Password hashing with bcrypt
- JWT authentication required for all routes
- Admin-only access for create, update, delete operations
- Soft delete (preserves data, sets isActive to false)

## Activity Logging
All driver operations are logged in the activity log system:
- Driver creation
- Driver updates
- Driver deletion
- Module: 'drivers'

## Navigation
- Accessible from sidebar: Dashboard → Drivers
- Route: `/dashboard/drivers`
- Icon: UserCircle

## Usage

### Add New Driver
1. Click "Add Driver" button
2. Fill in required fields (Full Name, Contact Number)
3. Optionally add email, address, license info, emergency contact
4. Click "Add Driver"
5. Default password "12345678" is automatically set
6. Success toast shows confirmation

### Edit Driver
1. Click edit icon on driver row
2. Update any information
3. Click "Update Driver"
4. Success toast shows confirmation

### Delete Driver
1. Click delete icon on driver row
2. Confirm deletion
3. Driver is soft-deleted (isActive = false, status = terminated)

### Search Drivers
- Type in search box to filter by name, contact, or license number
- Real-time filtering

### Filter by Status
- Use status dropdown to filter drivers
- Options: All, Active, On Leave, Inactive, Terminated

## Database Schema
```javascript
{
  fullName: String (required),
  contact: String (required, unique),
  email: String,
  address: String,
  licenseNumber: String (unique),
  licenseExpiry: Date,
  dateOfBirth: Date,
  joiningDate: Date,
  password: String (hashed),
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  status: String (enum),
  currentVehicle: ObjectId (ref: Vehicle),
  isActive: Boolean,
  timestamps: true
}
```

## Future Enhancements
- Driver performance tracking
- Trip history per driver
- Salary management
- Document uploads (license, ID proof)
- Driver attendance system
- Driver ratings and reviews
- SMS/Email notifications for license expiry
- Driver mobile app integration
