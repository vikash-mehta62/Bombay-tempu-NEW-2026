# Driver Calculation Feature - Complete Implementation

## Overview
Implemented a comprehensive multi-trip driver calculation system with preview and PDF download functionality.

## Features Implemented

### 1. Vehicle Integration
- Added `nextServiceKM` field to Vehicle model
- Auto-load vehicle's `nextServiceKM` and `currentOdometer` when selecting trips
- Update vehicle's `nextServiceKM` and `currentOdometer` when saving calculation

### 2. Trip Tracking
- Mark trips as "Already Calculated" once used in a calculation
- Prevent re-selection of calculated trips
- Visual indication (grayed out, disabled) for calculated trips
- Store `vehicleId` in DriverCalculation model

### 3. Detailed Preview Modal
- Professional format matching the provided screenshot
- Company header with BUTS logo
- Vehicle and driver information
- Combined Advance Payments table with trip-wise breakdown
- Combined Expenses table with trip-wise breakdown
- Kilometer Calculation section with all details
- Proper formatting with borders and styling

### 4. PDF Download
- Generate PDF using jsPDF and jspdf-autotable
- Professional layout matching preview
- Includes all advance and expense details
- Proper formatting and calculations
- Auto-named file: `Driver_Calculation_{DriverName}_{Date}.pdf`

### 5. Calculation Logic
- Old KM and New KM inputs
- Per KM rate (default 19.5)
- Previous balance (Pichla)
- Next Service KM
- Automatic calculation of:
  - Total KM = New KM - Old KM
  - KM Value = Total KM × Rate
  - Total Expenses (Kharcha) from selected trips
  - Total Advances from selected trips
  - Total = KM Value + Expenses + Pichla
  - Due = Total - Advances

## Files Modified

### Backend
1. **backend/models/Vehicle.js**
   - Added `nextServiceKM` field

2. **backend/models/DriverCalculation.js**
   - Added `vehicleId` field (required)

3. **backend/controllers/driverCalculationController.js**
   - Update vehicle's `nextServiceKM` and `currentOdometer` on save
   - Import Vehicle model

### Frontend
1. **frontend/components/DriverCalculationTab.js**
   - Complete rewrite with all new features
   - Trip selection with calculated trip tracking
   - Auto-load vehicle data
   - Preview modal with professional layout
   - PDF download functionality
   - Advance and expense details tracking

## Usage Flow

1. **Open Driver View Modal** → Navigate to "Driver Calculation" tab
2. **Click "New Calculation"**
3. **Select Trips** (only uncalculated trips from self-owned vehicles)
   - First selected trip's vehicle data auto-loads
   - Already calculated trips are disabled
4. **Enter KM Details**
   - Old KM (auto-filled from vehicle)
   - New KM
   - Rate per KM (default 19.5)
   - Previous Balance (Pichla)
   - Next Service KM (auto-filled from vehicle)
5. **Click "Calculate"** to see results
6. **Click "Preview"** to see formatted calculation
7. **Click "Download PDF"** to save as PDF
8. **Click "Save Calculation"** to store in database
   - Updates vehicle's nextServiceKM and currentOdometer
   - Marks trips as calculated
   - Creates activity log

## Database Schema

### DriverCalculation
```javascript
{
  driverId: ObjectId (required),
  vehicleId: ObjectId (required),
  tripIds: [ObjectId],
  oldKM: Number,
  newKM: Number,
  perKMRate: Number (default 19.5),
  pichla: Number,
  totalKM: Number,
  kmValue: Number,
  totalExpenses: Number,
  totalAdvances: Number,
  total: Number,
  due: Number,
  nextServiceKM: Number,
  originalTripData: Mixed,
  createdBy: ObjectId,
  timestamps: true
}
```

### Vehicle (Updated)
```javascript
{
  // ... existing fields
  currentOdometer: Number,
  nextServiceKM: Number  // NEW
}
```

## Preview Format

The preview modal displays:
- **Header**: Company name, address, contact details, BUTS logo
- **Info Section**: Vehicle number, date, driver name, contact
- **Combined Advance Payments**: Table with Trip, Date, Amount, Reason
- **Combined Expenses**: Table with Trip, Date, Amount, Category
- **Kilometer Calculation**: 
  - New KM, Old KM, Total KM
  - KM Rate calculation
  - Kharcha (Expenses)
  - Pichla (Previous balance)
  - Total
  - Advance
  - Trip (Final due amount)

## Activity Logs

Activity logs are created for:
- Create calculation (with driver name, trip count, total KM, due amount)
- Delete calculation

## Testing Checklist

- [ ] Select trips and verify vehicle data loads
- [ ] Calculate and verify all amounts are correct
- [ ] Preview shows correct format
- [ ] PDF downloads with correct data
- [ ] Save updates vehicle's nextServiceKM
- [ ] Calculated trips are marked and disabled
- [ ] Cannot select already calculated trips
- [ ] Activity logs are created
- [ ] Delete calculation works

## Notes

- Only self-owned vehicles are shown
- Only active trips are available
- Trips can only be calculated once
- Vehicle's nextServiceKM and currentOdometer are updated on save
- PDF uses jsPDF and jspdf-autotable (already installed)
- Preview modal uses Modal component
- All currency formatted as INR (₹)

## Future Enhancements

- Edit existing calculations
- Bulk PDF download for multiple calculations
- Email PDF to driver
- Print functionality
- Calculation templates
- Custom company header/logo upload
