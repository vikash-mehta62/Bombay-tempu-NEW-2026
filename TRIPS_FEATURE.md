# Trips Management Feature

## Overview
Complete trip management system with multi-client support, profit/loss calculation, and comprehensive route tracking.

## Features Implemented

### Backend (Node.js + Express + MongoDB)

#### 1. City Model (`backend/models/City.js`)
- City Name (required)
- State (required)
- Pincode (optional)
- Active status tracking

#### 2. Trip Model (`backend/models/Trip.js`)
- **Trip Information**
  - Auto-generated Trip Number (TRP000001)
  - Vehicle Reference (required)
  - Driver Reference (optional - only for self-owned vehicles)
  - Load Date (required)
  - Trip Status (scheduled, in_progress, completed, cancelled)

- **Multi-Client Support**
  - Array of clients with individual details:
    - Client Reference
    - Origin City (pickup location)
    - Destination City (drop-off location)
    - Client Rate (amount client pays)
    - Truck Hire Cost (for fleet-owned vehicles)
    - Adjustment amount
    - Packaging Type (boxes, pallets, loose, container, other)
    - Special Instructions per client

- **Overall Trip Details**
  - Overall Trip Rate (for self-owned vehicles)
  - Commission Type (fixed/percentage)
  - Commission Amount
  - POD Balance

- **Auto-Calculated Fields**
  - Total Client Revenue
  - Total Costs
  - Total Adjustments
  - Profit/Loss

- **Calculation Logic**
  - **For Self-Owned Vehicles:**
    - Profit/Loss = Total Client Revenue - Overall Trip Rate - Total Adjustments - Commission + POD Balance
  
  - **For Fleet-Owned Vehicles:**
    - Profit/Loss = Total Client Revenue - Sum of Truck Hire Costs - Total Adjustments - Commission + POD Balance

#### 3. Controllers
- **Trip Controller** (`backend/controllers/tripController.js`)
  - Get all trips with filters (status, date range, search)
  - Get trip by ID with full population
  - Create new trip with auto-calculations
  - Update trip
  - Delete trip (soft delete)
  - Update trip status
  - Get trip statistics

- **City Controller** (`backend/controllers/cityController.js`)
  - Get all cities with search
  - Create new city
  - Get city by ID

#### 4. Routes
- `GET /api/trips` - Get all trips
- `GET /api/trips/stats` - Get trip statistics
- `GET /api/trips/:id` - Get trip by ID
- `POST /api/trips` - Create new trip
- `PUT /api/trips/:id` - Update trip
- `PATCH /api/trips/:id/status` - Update trip status
- `DELETE /api/trips/:id` - Delete trip

- `GET /api/cities` - Get all cities
- `POST /api/cities` - Create new city
- `GET /api/cities/:id` - Get city by ID

### Frontend (Next.js 14 + Tailwind CSS)

#### 1. Trips Page (`frontend/app/dashboard/trips/page.js`)
- **Statistics Dashboard**
  - Total Trips count
  - In Progress trips count
  - Total Revenue
  - Total Profit/Loss (color-coded)

- **Search & Filter**
  - Search by trip number or vehicle
  - Filter by status (scheduled, in_progress, completed, cancelled)

- **Trips Table**
  - Trip number with client count
  - Vehicle and driver details
  - Route information (origin → destination)
  - Load date
  - Revenue amount
  - Profit/Loss with trend indicators
  - Status badge
  - Edit and Delete actions

#### 2. Trip Form Modal (`frontend/components/TripFormModal.js`)
- **Vehicle Selection**
  - Dropdown with search functionality
  - Shows ownership type (self-owned/fleet-owner)
  - Shows fleet owner name if applicable

- **Driver Selection**
  - Only shown for self-owned vehicles
  - Dropdown with search functionality
  - Shows driver name and contact

- **Load Date**
  - Date picker for trip scheduling

- **Multi-Client Support**
  - Client #1 opened by default
  - "Add Another Client" button to add more clients
  - Each client section includes:
    - **Client Selection**
      - Dropdown with search
      - Shows client name and company
    
    - **Origin City (Pickup)**
      - Dropdown with search
      - "Add New City" inline form
      - City form: City Name, State, Pincode (optional)
    
    - **Destination City (Drop-off)**
      - Dropdown with search
      - "Add New City" inline form
      - City form: City Name, State, Pincode (optional)
    
    - **Client Rate** (required)
      - Amount client will pay
    
    - **Truck Hire Cost** (required for fleet-owned)
      - Cost to hire the truck
      - Only shown for fleet-owned vehicles
    
    - **Adjustment**
      - Additional adjustments (positive or negative)
    
    - **Packaging Type**
      - Dropdown: Boxes, Pallets, Loose, Container, Other
    
    - **Special Instructions**
      - Text area for client-specific instructions

- **Overall Trip Details**
  - **Overall Trip Rate** (required for self-owned)
    - Only shown for self-owned vehicles
  
  - **Commission Type**
    - Fixed or Percentage
  
  - **Commission Amount**
    - Amount in ₹ or %
  
  - **POD Balance**
    - Proof of Delivery balance

- **Real-time Profit & Loss Calculation**
  - Three cards showing:
    - Total Client Revenue (green)
    - Total Costs (red)
    - Overall Trip Profit/Loss (blue/orange)
  - Detailed calculation formula shown
  - Updates in real-time as user types

- **Additional Information**
  - Special Instructions text area

## Key Differences: Self-Owned vs Fleet-Owned

### Self-Owned Vehicles
- Driver selection is available
- Overall Trip Rate field is required
- No Truck Hire Cost per client
- Calculation: Revenue - Overall Trip Rate - Adjustments - Commission + POD

### Fleet-Owned Vehicles
- No driver selection (fleet owner manages drivers)
- No Overall Trip Rate field
- Truck Hire Cost required for each client
- Calculation: Revenue - Sum of Hire Costs - Adjustments - Commission + POD

## Profit/Loss Calculation Examples

### Example 1: Self-Owned Vehicle
- Client #1 Rate: ₹50,000
- Overall Trip Rate: ₹42,005
- Adjustment: ₹2,000
- Commission (Fixed): ₹200
- POD Balance: ₹0
- **Profit = ₹50,000 - ₹42,005 - ₹2,000 - ₹200 + ₹0 = ₹5,795**

### Example 2: Fleet-Owned Vehicle
- Client #1 Rate: ₹50,000
- Truck Hire Cost: ₹42,005
- Adjustment: ₹2,000
- Commission (Fixed): ₹200
- POD Balance: ₹0
- **Profit = ₹50,000 - ₹42,005 - ₹2,000 - ₹200 + ₹0 = ₹5,795**

### Example 3: Multiple Clients
- Client #1 Rate: ₹50,000
- Client #2 Rate: ₹30,000
- Total Revenue: ₹80,000
- Overall Trip Rate: ₹60,000
- Total Adjustments: ₹3,000
- Commission (5%): ₹4,000
- POD Balance: ₹1,000
- **Profit = ₹80,000 - ₹60,000 - ₹3,000 - ₹4,000 + ₹1,000 = ₹14,000**

## Status Management
- **Scheduled**: Trip is planned but not started
- **In Progress**: Trip is currently ongoing
- **Completed**: Trip has been completed
- **Cancelled**: Trip was cancelled

## Search & Filter Features
- Search trips by trip number or vehicle number
- Filter by status
- Filter by date range (future enhancement)

## Activity Logging
All trip operations are logged:
- Trip creation
- Trip updates
- Trip deletion
- Status changes
- Module: 'trips'

## Navigation
- Accessible from sidebar: Dashboard → Trips
- Route: `/dashboard/trips`
- Icon: MapPin

## Database Schema

### Trip Schema
```javascript
{
  tripNumber: String (unique, auto-generated),
  vehicleId: ObjectId (ref: Vehicle, required),
  driverId: ObjectId (ref: Driver),
  loadDate: Date (required),
  clients: [{
    clientId: ObjectId (ref: Client, required),
    originCity: ObjectId (ref: City, required),
    destinationCity: ObjectId (ref: City, required),
    clientRate: Number (required),
    truckHireCost: Number,
    adjustment: Number,
    packagingType: String (enum),
    specialInstructions: String
  }],
  overallTripRate: Number (required),
  commissionType: String (enum: fixed, percentage),
  commissionAmount: Number,
  podBalance: Number,
  totalClientRevenue: Number (calculated),
  totalCosts: Number (calculated),
  totalAdjustments: Number (calculated),
  profitLoss: Number (calculated),
  status: String (enum),
  additionalInstructions: String,
  isActive: Boolean,
  timestamps: true
}
```

### City Schema
```javascript
{
  cityName: String (required),
  state: String (required),
  pincode: String,
  isActive: Boolean,
  timestamps: true
}
```

## Future Enhancements
- GPS tracking integration
- Real-time trip status updates
- Driver mobile app for trip updates
- Automatic POD upload
- Expense tracking per trip
- Fuel consumption tracking
- Route optimization
- Trip history and analytics
- Invoice generation from trips
- Payment tracking per trip
- Document management (LR, POD, etc.)
- SMS/Email notifications for trip updates
- Trip scheduling calendar view
- Multi-stop route support
- Load/unload time tracking
