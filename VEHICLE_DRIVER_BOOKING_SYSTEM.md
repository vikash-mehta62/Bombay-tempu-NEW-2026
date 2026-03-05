# Vehicle and Driver Booking System

## Overview
This document describes the automatic vehicle and driver booking system that prevents double-booking of resources.

## How It Works

### 1. Trip Creation (Scheduled Status)
When a new trip is created:
- **Vehicle Status**: Changed to `on_trip`
- **Driver Status**: Remains `active` but `currentVehicle` is set to the trip's vehicle
- **Result**: Vehicle and driver are now "booked" and won't appear in the available list for new trips

### 2. Trip Started (In Progress Status)
When trip status changes to "in_progress":
- **Vehicle Status**: Ensured to be `on_trip`
- **Driver Status**: Ensured to be `active` with `currentVehicle` set
- **Result**: Confirms that vehicle and driver remain booked during the trip

### 3. Trip Completed
When trip status changes to "completed":
- **Vehicle Status**: Changed to `available`
- **Driver Status**: Remains `active` but `currentVehicle` is cleared (set to null)
- **Result**: Vehicle and driver are now available for new trips

### 4. Trip Cancelled/Deleted
When a trip is cancelled or deleted:
- **Vehicle Status**: Changed to `available`
- **Driver Status**: Remains `active` but `currentVehicle` is cleared (set to null)
- **Result**: Vehicle and driver are released and available for new trips

## Trip Status Flow

```
Trip Scheduled → Trip Started → Trip Completed
     ↓               ↓               ↓
  Booked         Booked         Available
```

Or:

```
Trip Scheduled → Cancelled
     ↓               ↓
  Booked         Available
```

## Vehicle Status Values
- `available` - Can be assigned to new trips
- `on_trip` - Currently assigned to an active trip
- `maintenance` - Under maintenance
- `breakdown` - Vehicle broken down
- `sold` - Vehicle sold

## Driver Status Values
- `active` - Driver is active (can be available or on trip based on `currentVehicle`)
- `inactive` - Driver not working
- `on_leave` - Driver on leave
- `terminated` - Driver terminated

## Filtering in Trip Form
When creating a new trip, the form shows:
- **Vehicles**: Only those with `currentStatus = 'available'`
- **Drivers**: Only those with `status = 'active'` AND `currentVehicle = null`

When editing an existing trip:
- Current vehicle and driver are also shown (even if booked)
- This allows updating the same trip without issues

## User Interface Indicators

### Trip Form Modal
- Shows count of available vehicles: "X available vehicle(s)"
- Shows count of available drivers: "X available driver(s)"

### Vehicles Page
- Displays `currentStatus` badge with color coding
- Green: Available
- Yellow: On Trip
- Red: Maintenance/Breakdown

### Drivers Page
- Displays `status` badge with color coding
- Shows current vehicle number if driver is on a trip
- Example: "🚛 MH12AB1234" below driver name

## Backend Implementation

### Files Modified
1. `backend/controllers/tripController.js`
   - `createTrip()` - Sets vehicle and driver as booked
   - `updateTripStatus()` - Handles status changes
   - `deleteTrip()` - Releases vehicle and driver

2. `frontend/components/TripFormModal.js`
   - Filters available vehicles and drivers
   - Shows availability counts

## Activity Logging
All vehicle and driver status changes are logged with:
- User who made the change
- Trip number
- Action performed
- Timestamp

## Benefits
1. **Prevents Double Booking**: A vehicle/driver can't be assigned to multiple active trips
2. **Automatic Management**: Status updates happen automatically with trip status changes
3. **Clear Visibility**: Users can see which vehicles/drivers are available
4. **Audit Trail**: All changes are logged for tracking

## Testing Checklist
- [ ] Create a trip - vehicle and driver should be marked as booked
- [ ] Try creating another trip with same vehicle - should not appear in list
- [ ] Try creating another trip with same driver - should not appear in list
- [ ] Complete the trip - vehicle and driver should become available
- [ ] Create a new trip with the same vehicle/driver - should work now
- [ ] Cancel a trip - vehicle and driver should become available
- [ ] Delete a trip - vehicle and driver should become available
- [ ] Edit a trip - current vehicle and driver should be visible in dropdown
