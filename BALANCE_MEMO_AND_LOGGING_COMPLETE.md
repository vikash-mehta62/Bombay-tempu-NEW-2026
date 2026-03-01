# Balance Memo & Activity Logging - Complete Implementation

## Balance Memo Implementation

### Backend Files Created:
1. **Model** (`backend/models/BalanceMemo.js`)
   - Fields: invoiceNumber, date, customerName, vehicleNumber, from, to, freight, advance, detention, unloadingCharge, totalPayable, remarks
   - Includes `createdBy` field to track who created it
   - Soft delete with `isActive` flag

2. **Controller** (`backend/controllers/balanceMemoController.js`)
   - `createMemo` - Creates balance memo with activity logging
   - `updateMemo` - Updates memo with before/after change tracking
   - `getMemosByTrip` - Gets all memos for a trip
   - `getMemoById` - Gets single memo
   - `deleteMemo` - Soft deletes memo with logging

3. **Routes** (`backend/routes/balanceMemos.js`)
   - POST `/api/balance-memos` - Create
   - PUT `/api/balance-memos/:id` - Update
   - GET `/api/balance-memos/trip/:tripId` - Get by trip
   - GET `/api/balance-memos/:id` - Get by ID
   - DELETE `/api/balance-memos/:id` - Delete

4. **Server Registration** (`backend/server.js`)
   - Added route: `app.use('/api/balance-memos', require('./routes/balanceMemos'))`

### Frontend Updates:
1. **API** (`frontend/lib/api.js`)
   - Added `balanceMemoAPI` with all CRUD methods

2. **Trip Details Page** (`frontend/app/dashboard/trips/[id]/page.js`)
   - Imported `balanceMemoAPI`
   - Added `loadBalanceMemos()` function
   - Updated `handleCreateBalanceMemo()` to save to backend
   - Calls `loadBalanceMemos()` on page load

3. **Balance Memo Modal** (`frontend/components/BalanceMemoModal.js`)
   - Already has proper format and PDF generation
   - Auto-calculates: Advance, Unloading Charge, Total Payable
   - Formula: Total Payable = Freight - Advance + Detention + Unloading Charge

## Activity Logging Implementation

### What Gets Logged:
✅ **Trip Expenses** - Create, Delete
✅ **Trip Advances** - Create, Delete
✅ **Client Payments** - Create, Delete
✅ **Client Expenses** - Create, Delete
✅ **Collection Memos** - Create, Update, Delete
✅ **Balance Memos** - Create, Update, Delete

### What Does NOT Get Logged:
❌ **GET Requests** - Reading/viewing data doesn't create logs
❌ **List Operations** - Browsing lists doesn't create logs

### Log Format:

Each log entry includes:
```javascript
{
  userId: ObjectId,              // Who performed the action
  userName: "Admin User",        // User's full name
  userRole: "admin",             // User's role
  action: "Added fuel expense of ₹5000 for trip TRP000001",  // Human-readable description
  actionType: "CREATE",          // CREATE, UPDATE, DELETE
  module: "expenses",            // expenses, payments, trips
  entityId: ObjectId,            // ID of the affected record
  entityType: "TripExpense",     // Model name
  details: {                     // Additional context
    tripNumber: "TRP000001",
    clientName: "Vikash client",
    amount: 5000,
    ...
  },
  changes: {                     // For UPDATE operations
    before: {...},
    after: {...}
  },
  ipAddress: "::1",              // Request IP
  userAgent: "Mozilla/5.0...",   // Browser info
  timestamp: Date                // When it happened
}
```

### Example Log Messages:

**Expenses:**
- "Added fuel expense of ₹5000 for trip TRP000001"
- "Deleted fuel expense of ₹5000"

**Advances:**
- "Added advance of ₹10000 to Fleet Owner Name for trip TRP000001"
- "Deleted advance of ₹10000 to Fleet Owner Name"

**Client Payments:**
- "Added client payment of ₹50000 from Vikash client for trip TRP000001"
- "Deleted client payment of ₹50000 from Vikash client"

**Client Expenses:**
- "Added client expense of ₹1000 (Fuel) for Vikash client in trip TRP000001"
- "Deleted client expense of ₹1000 (Fuel) for Vikash client"

**Collection Memos:**
- "Created collection memo TRP000001 for Vikash client in trip TRP000001"
- "Updated collection memo TRP000001 for Vikash client"
- "Deleted collection memo TRP000001 for Vikash client"

**Balance Memos:**
- "Created balance memo for Vikash client in trip TRP000001"
- "Updated balance memo for Vikash client"
- "Deleted balance memo for Vikash client"

## Display in UI

### Trip Details Page:
All expenses, advances, payments show:
```
Fuel
testing
25 Feb 2026
Added by: Admin User  ← Blue text
₹5,000
```

### Activity Logs Page:
Shows in table format:
- Date & Time
- User (with avatar)
- Action (human-readable message)
- Module (Expenses, Payments, Trips)
- Type (CREATE, UPDATE, DELETE badge)
- IP Address

## Database Schema Updates

All transaction schemas now include:
```javascript
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
}
```

This allows tracking who created each:
- Trip Expense
- Trip Advance
- Client Payment
- Client Expense
- Collection Memo
- Balance Memo

## Benefits

1. **Full Audit Trail** - Every action is logged with user info
2. **User Accountability** - Know who did what and when
3. **Change Tracking** - UPDATE operations store before/after states
4. **Rich Context** - Logs include trip numbers, client names, amounts
5. **Non-Intrusive** - Logging errors don't break main operations
6. **Performance** - GET requests don't create logs (no overhead)

## Testing

To verify:
1. Create an expense → Check activity logs for "Added fuel expense..."
2. Add client payment → Check logs for "Added client payment..."
3. Create collection memo → Check logs for "Created collection memo..."
4. Create balance memo → Check logs for "Created balance memo..."
5. Delete any item → Check logs for "Deleted..." message
6. View trip details → No log created (GET request)

All logs will show:
- User who performed action
- Exact details of what was done
- Trip number and client name
- Timestamp and IP address
