# Self-Owned Vehicle Financial Tracking Feature

## Overview
Self-owned vehicles ab properly support karte hain with separate tracking for:
- **Vehicle Expenses** (fuel, toll, maintenance, etc.)
- **Driver Advances** (driver ko diye gaye advance payments)

Fleet-owned vehicles ke liye POD management aur fleet owner advances remain same.

---

## Changes Made

### 1. Frontend Changes (`frontend/app/dashboard/trips/[id]/page.js`)

#### A. Manage POD Button - Conditional Display
```javascript
{/* Show Manage POD only for fleet-owned vehicles */}
{isFleetOwned && (
  <button onClick={handleOpenManagePODModal}>
    <Wallet className="w-4 h-4" />
    <span>Manage POD</span>
  </button>
)}
```

#### B. Financial Tracking Section - Dual Layout

**Fleet-Owned Vehicles:**
- Title: "Fleet Owner Financial Tracking"
- Shows: Total Fleet Owner, Total Expenses, Total Advances
- Tabs: "Expenses" and "Advances"
- POD advances with purple badge
- Download Receipt button

**Self-Owned Vehicles:**
- Title: "Vehicle & Driver Financial Tracking"
- Shows: Vehicle Expenses, Driver Advances
- Tabs: "Vehicle Expenses" and "Driver Advances"
- No POD management
- No receipt download

#### C. Modal Titles - Dynamic
```javascript
// Expense Modal
{isFleetOwned ? 'Add Fleet Owner Expense' : 'Add Vehicle Expense'}

// Advance Modal
{isFleetOwned ? 'Add Fleet Owner Advance Payment' : 'Add Driver Advance Payment'}
```

#### D. handleAddAdvance - Updated Logic
```javascript
const handleAddAdvance = async (e) => {
  e.preventDefault();
  
  const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
  
  if (isFleetOwned && !trip.vehicleId?.fleetOwnerId?._id) {
    toast.error('Fleet owner not found');
    return;
  }
  
  try {
    await tripAdvanceAPI.create({
      tripId: params.id,
      fleetOwnerId: isFleetOwned ? trip.vehicleId.fleetOwnerId._id : null,
      driverId: !isFleetOwned ? trip.driverId?._id : null,
      ...advanceForm
    });
    toast.success(isFleetOwned ? 'Fleet owner advance added' : 'Driver advance added');
    // ...
  }
};
```

---

### 2. Backend Changes

#### A. TripAdvance Model (`backend/models/TripAdvance.js`)

**Added driverId field:**
```javascript
const tripAdvanceSchema = new mongoose.Schema({
  tripId: { type: ObjectId, ref: 'Trip', required: true },
  fleetOwnerId: { type: ObjectId, ref: 'FleetOwner', default: null }, // Changed from required
  driverId: { type: ObjectId, ref: 'Driver', default: null }, // NEW FIELD
  amount: { type: Number, required: true },
  // ... other fields
});
```

#### B. TripAdvance Controller (`backend/controllers/tripAdvanceController.js`)

**createAdvance - Updated:**
```javascript
const createAdvance = async (req, res) => {
  const { tripId, fleetOwnerId, driverId, amount, description, paymentMethod, date } = req.body;
  
  const trip = await Trip.findById(tripId).populate('vehicleId').populate('driverId');
  const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
  
  let recipientName = '';
  
  if (isFleetOwned) {
    // Verify fleet owner
    const fleetOwner = await FleetOwner.findById(fleetOwnerId);
    recipientName = fleetOwner.fullName;
  } else {
    // Driver advance (driverId can be null)
    if (driverId) {
      const driver = await Driver.findById(driverId);
      recipientName = driver ? driver.fullName : 'Driver';
    } else {
      recipientName = 'Driver (Not Assigned)';
    }
  }
  
  const advance = await TripAdvance.create({
    tripId,
    fleetOwnerId: isFleetOwned ? fleetOwnerId : null,
    driverId: !isFleetOwned ? driverId : null,
    amount,
    description,
    paymentMethod,
    date,
    createdBy: req.user._id,
    isActive: true
  });
  
  // Activity log with proper recipient info
  await createActivityLog({
    action: `Added ${isFleetOwned ? 'fleet owner' : 'driver'} advance of ₹${amount} to ${recipientName}`,
    // ...
  });
};
```

**getAdvancesByTrip - Updated:**
```javascript
const advances = await TripAdvance.find({ tripId, isActive: true })
  .populate('fleetOwnerId', 'fullName contact')
  .populate('driverId', 'fullName contact') // NEW
  .populate('createdBy', 'fullName username')
  .sort({ date: -1 });
```

---

## User Experience

### Fleet-Owned Vehicle Trip

1. **Header**: Shows "Manage POD" button
2. **Financial Section**: 
   - Title: "Fleet Owner Financial Tracking"
   - Shows fleet owner name
   - 3 cards: Total Fleet Owner, Total Expenses, Total Advances
   - Buttons: Add Expense, Add Advance, Download Receipt
3. **Tabs**:
   - Expenses: Fleet owner expenses
   - Advances: Fleet owner advances (POD advances with purple badge)
4. **Modals**:
   - "Add Fleet Owner Expense"
   - "Add Fleet Owner Advance Payment"

### Self-Owned Vehicle Trip

1. **Header**: NO "Manage POD" button
2. **Financial Section**:
   - Title: "Vehicle & Driver Financial Tracking"
   - Shows driver name (or "Not Assigned")
   - 2 cards: Vehicle Expenses, Driver Advances
   - Buttons: Add Vehicle Expense, Add Driver Advance
3. **Tabs**:
   - Vehicle Expenses: Fuel, toll, maintenance, etc.
   - Driver Advances: Advances given to driver
4. **Modals**:
   - "Add Vehicle Expense"
   - "Add Driver Advance Payment"

---

## Database Schema

### TripAdvance Collection

```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: Trip),
  fleetOwnerId: ObjectId (ref: FleetOwner) | null,  // For fleet-owned
  driverId: ObjectId (ref: Driver) | null,          // For self-owned
  amount: Number,
  description: String,
  paymentMethod: String,
  date: Date,
  advanceType: 'manual' | 'pod_submission',
  podHistoryId: ObjectId | null,
  createdBy: ObjectId (ref: User),
  isActive: Boolean
}
```

**Rules:**
- Fleet-owned: `fleetOwnerId` populated, `driverId` null
- Self-owned: `driverId` populated (or null if no driver), `fleetOwnerId` null
- POD submissions: Only for fleet-owned, `advanceType: 'pod_submission'`

---

## Testing Checklist

### Fleet-Owned Vehicle
- [x] Manage POD button visible
- [x] Can submit POD amounts
- [x] POD advances created automatically
- [x] POD advances show with purple badge
- [x] Can add fleet owner expenses
- [x] Can add fleet owner advances
- [x] Download receipt works
- [x] Activity logs show "fleet owner advance"

### Self-Owned Vehicle
- [x] Manage POD button hidden
- [x] Shows "Vehicle & Driver Financial Tracking"
- [x] Can add vehicle expenses
- [x] Can add driver advances
- [x] Driver advances saved with driverId
- [x] No POD management
- [x] No receipt download
- [x] Activity logs show "driver advance"

---

## API Changes

### Create Advance Endpoint
```
POST /api/trip-advances
Body: {
  tripId: ObjectId,
  fleetOwnerId: ObjectId | null,  // For fleet-owned
  driverId: ObjectId | null,      // For self-owned
  amount: Number,
  description: String,
  paymentMethod: String,
  date: Date
}
```

**Logic:**
- If vehicle is fleet-owned: `fleetOwnerId` required, `driverId` ignored
- If vehicle is self-owned: `driverId` optional, `fleetOwnerId` ignored

---

## Summary

✅ **Fleet-Owned Vehicles**: Full POD management, fleet owner expenses/advances, receipt download
✅ **Self-Owned Vehicles**: Vehicle expenses, driver advances, no POD management
✅ **Backend**: Supports both fleetOwnerId and driverId in TripAdvance model
✅ **Activity Logs**: Properly distinguish between fleet owner and driver advances
✅ **UI**: Dynamic titles and sections based on ownership type

Sab kuch properly separated hai aur dono types of vehicles ke liye appropriate features available hain!
