# Activity Logging Implementation

## Summary
Implemented comprehensive activity logging system for all trip-related operations including expenses, advances, payments, and collection memos.

## Changes Made

### 1. Created Activity Logger Utility (`backend/utils/activityLogger.js`)
- Centralized logging function `createActivityLog()`
- Captures user info, action details, IP address, user agent
- Non-blocking - errors don't break main flow
- Supports before/after change tracking

### 2. Updated Schemas - Added `createdBy` Field
All schemas now track who created the record:

- `backend/models/TripExpense.js` - Added `createdBy` field
- `backend/models/TripAdvance.js` - Added `createdBy` field
- `backend/models/ClientPayment.js` - Added `createdBy` field
- `backend/models/ClientExpense.js` - Added `createdBy` field
- `backend/models/CollectionMemo.js` - Added `createdBy` field

### 3. Updated Controllers with Logging

#### Trip Expense Controller (`backend/controllers/tripExpenseController.js`)
- **CREATE**: Logs expense creation with type, amount, trip number
- **DELETE**: Logs expense deletion with details
- Populates `createdBy` field on create
- Returns `createdBy` user info in GET requests

#### Trip Advance Controller (`backend/controllers/tripAdvanceController.js`)
- **CREATE**: Logs advance payment to fleet owner
- **DELETE**: Logs advance deletion
- Tracks fleet owner name and payment method
- Populates `createdBy` field

#### Client Payment Controller (`backend/controllers/clientPaymentController.js`)
- **CREATE**: Logs client payment with amount, method, purpose
- **DELETE**: Logs payment deletion
- Tracks client name and trip number
- Populates `createdBy` field

#### Client Expense Controller (`backend/controllers/clientExpenseController.js`)
- **CREATE**: Logs client expense with type and paid by
- **DELETE**: Logs expense deletion
- Tracks expense type and client name
- Populates `createdBy` field

#### Collection Memo Controller (`backend/controllers/collectionMemoController.js`)
- **CREATE**: Logs memo creation with collection number
- **UPDATE**: Logs memo updates with before/after changes
- **DELETE**: Logs memo deletion
- Tracks client name, trip number, and memo details
- Populates `createdBy` field

## Activity Log Structure

Each log entry contains:
```javascript
{
  userId: ObjectId,           // User who performed action
  userName: String,            // User's full name
  userRole: String,            // User's role
  action: String,              // Human-readable action description
  actionType: String,          // CREATE, UPDATE, DELETE, etc.
  module: String,              // expenses, payments, trips, etc.
  entityId: ObjectId,          // ID of affected entity
  entityType: String,          // TripExpense, ClientPayment, etc.
  details: Object,             // Additional context
  changes: {                   // For UPDATE operations
    before: Object,
    after: Object
  },
  ipAddress: String,           // Request IP
  userAgent: String,           // Browser/client info
  timestamp: Date              // Auto-generated
}
```

## Log Examples

### Trip Expense Created
```
Action: "Added fuel expense of ₹5000 for trip TRP000001"
Module: expenses
Type: CREATE
Details: { tripNumber, expenseType, amount, fleetOwnerId }
```

### Client Payment Added
```
Action: "Added client payment of ₹50000 from Vikash client for trip TRP000001"
Module: payments
Type: CREATE
Details: { clientName, amount, paymentMethod, purpose }
```

### Collection Memo Updated
```
Action: "Updated collection memo TRP000001 for Vikash client"
Module: trips
Type: UPDATE
Changes: { before: {...}, after: {...} }
```

## Benefits

1. **Full Audit Trail**: Every action is logged with user info
2. **User Accountability**: `createdBy` field tracks who created each record
3. **Change Tracking**: UPDATE operations store before/after states
4. **Non-Intrusive**: Logging errors don't break main operations
5. **Rich Context**: IP address, user agent, and detailed info captured
6. **Easy Querying**: Indexed by userId, module, actionType, timestamp

## Database Indexes

Activity logs are indexed for fast queries:
- `userId + timestamp`
- `module + timestamp`
- `actionType + timestamp`
- `timestamp` (descending)

## Usage in Frontend

Activity logs can be displayed in:
- User activity dashboard
- Trip history timeline
- Audit reports
- User action history

## API Endpoints

Existing log endpoints (from `backend/routes/logs.js`):
- `GET /api/logs` - Get all logs with filters
- `GET /api/logs/recent?limit=50` - Recent logs
- `GET /api/logs/user/:userId` - User-specific logs
- `GET /api/logs/module/:module` - Module-specific logs
- `GET /api/logs/stats` - Log statistics

## Testing

To verify logging:
1. Create an expense/advance/payment
2. Check Activity Logs in dashboard
3. Verify user name, action, and details are correct
4. Check `createdBy` field in database records

## Future Enhancements

- Add logging for Trip create/edit/delete
- Add logging for Vehicle operations
- Add logging for Driver operations
- Add logging for Client operations
- Email notifications for critical actions
- Real-time activity feed
