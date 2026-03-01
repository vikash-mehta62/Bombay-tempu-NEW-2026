# Vehicle Expense Tracking Feature

## Overview
Self-owned vehicles ke expenses ab vehicle account mein store honge, fleet-owned vehicles ke expenses fleet owner account mein.

---

## Changes Made

### 1. Database Schema - TripExpense Model

**Added vehicleId field:**
```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: Trip),
  fleetOwnerId: ObjectId (ref: FleetOwner) | null,  // For fleet-owned
  vehicleId: ObjectId (ref: Vehicle) | null,        // For self-owned
  expenseType: String,
  amount: Number,
  description: String,
  additionalNotes: String,
  receiptNumber: String,
  date: Date,
  createdBy: ObjectId (ref: User),
  isActive: Boolean
}
```

**Rules:**
- Fleet-owned vehicle: `fleetOwnerId` populated, `vehicleId` null
- Self-owned vehicle: `vehicleId` populated, `fleetOwnerId` null

---

### 2. Frontend Changes (`frontend/app/dashboard/trips/[id]/page.js`)

#### handleAddExpense - Updated Logic
```javascript
const handleAddExpense = async (e) => {
  e.preventDefault();
  
  const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
  const fleetOwnerId = trip.vehicleId?.fleetOwnerId?._id || null;
  const vehicleId = trip.vehicleId?._id || null;
  
  try {
    await tripExpenseAPI.create({
      tripId: params.id,
      fleetOwnerId: isFleetOwned ? fleetOwnerId : null,
      vehicleId: !isFleetOwned ? vehicleId : null,
      ...expenseForm
    });
    toast.success(isFleetOwned 
      ? 'Fleet owner expense added successfully' 
      : 'Vehicle expense added successfully'
    );
    // ...
  }
};
```

---

### 3. Backend Changes

#### A. TripExpense Model (`backend/models/TripExpense.js`)
```javascript
const tripExpenseSchema = new mongoose.Schema({
  // ... other fields
  fleetOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FleetOwner',
    default: null  // Changed from required
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null  // NEW FIELD
  },
  // ... other fields
});

// Added index
tripExpenseSchema.index({ vehicleId: 1 });
```

#### B. TripExpense Controller (`backend/controllers/tripExpenseController.js`)

**createExpense - Updated:**
```javascript
const createExpense = async (req, res) => {
  const { tripId, fleetOwnerId, vehicleId, expenseType, amount, ... } = req.body;
  
  const trip = await Trip.findById(tripId).populate('vehicleId');
  const isFleetOwned = trip.vehicleId?.ownershipType === 'fleet_owner';
  
  let expenseTarget = '';
  
  if (isFleetOwned) {
    // Verify fleet owner
    const fleetOwner = await FleetOwner.findById(fleetOwnerId);
    expenseTarget = `fleet owner ${fleetOwner.fullName}`;
  } else {
    // Expense linked to vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    expenseTarget = `vehicle ${vehicle.vehicleNumber}`;
  }
  
  const expense = await TripExpense.create({
    tripId,
    fleetOwnerId: isFleetOwned ? fleetOwnerId : null,
    vehicleId: !isFleetOwned ? vehicleId : null,
    expenseType,
    amount,
    description,
    additionalNotes,
    receiptNumber,
    date,
    createdBy: req.user._id,
    isActive: true
  });
  
  // Activity log
  await createActivityLog({
    action: `Added ${expenseType} expense of ₹${amount} for ${expenseTarget}`,
    details: {
      targetType: isFleetOwned ? 'fleet_owner' : 'vehicle',
      targetId: isFleetOwned ? fleetOwnerId : vehicleId,
      targetName: expenseTarget
    }
  });
};
```

**getExpensesByTrip - Updated:**
```javascript
const expenses = await TripExpense.find({ tripId, isActive: true })
  .populate('fleetOwnerId', 'fullName contact')
  .populate('vehicleId', 'vehicleNumber brand model')  // NEW
  .populate('createdBy', 'fullName username')
  .sort({ date: -1 });
```

---

## User Experience

### Fleet-Owned Vehicle Trip
1. Add Expense → Expense linked to **Fleet Owner**
2. Expense stored with `fleetOwnerId`
3. Activity log: "Added fuel expense of ₹500 for fleet owner Vikash Maheshwari"

### Self-Owned Vehicle Trip
1. Add Vehicle Expense → Expense linked to **Vehicle**
2. Expense stored with `vehicleId`
3. Activity log: "Added fuel expense of ₹500 for vehicle MP04SV2148"

---

## Benefits

✅ **Fleet-Owned**: Expenses track karte hain fleet owner ke account mein
✅ **Self-Owned**: Expenses track karte hain vehicle ke account mein
✅ **Proper Accounting**: Har expense properly categorized
✅ **Activity Logs**: Clear distinction between fleet owner and vehicle expenses
✅ **Future Reports**: Vehicle-wise expense reports generate kar sakte ho

---

## API Changes

### Create Expense Endpoint
```
POST /api/trip-expenses
Body: {
  tripId: ObjectId,
  fleetOwnerId: ObjectId | null,  // For fleet-owned
  vehicleId: ObjectId | null,     // For self-owned
  expenseType: String,
  amount: Number,
  description: String,
  additionalNotes: String,
  receiptNumber: String,
  date: Date
}
```

**Logic:**
- If vehicle is fleet-owned: `fleetOwnerId` required, `vehicleId` ignored
- If vehicle is self-owned: `vehicleId` required, `fleetOwnerId` ignored

---

## Testing Checklist

### Fleet-Owned Vehicle
- [x] Expense adds with fleetOwnerId
- [x] vehicleId is null
- [x] Activity log shows "fleet owner {name}"
- [x] Expense appears in fleet owner expenses

### Self-Owned Vehicle
- [x] Expense adds with vehicleId
- [x] fleetOwnerId is null
- [x] Activity log shows "vehicle {number}"
- [x] Expense appears in vehicle expenses

---

## Summary

Ab self-owned vehicles ke expenses properly vehicle account mein store honge aur fleet-owned vehicles ke expenses fleet owner account mein. Sab properly tracked hai!
