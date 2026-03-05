# Activity Logs & Login System Documentation

## Part 1: Activity Logs - Kab Kab Save Ho Rahe Hain

### 1. TRIP OPERATIONS

#### Trip Create (tripController.js)
- **Kab**: Jab naya trip create hota hai
- **Log**: "Created trip {tripNumber} with {X} client(s) and auto-generated PODs. Vehicle and driver marked as on_trip."
- **Details**: Trip number, client count

#### Trip Update (tripController.js)
- **Kab**: Jab trip edit hoti hai aur clients add/remove hote hain
- **Logs**:
  - "Updated trip {tripNumber} - Deactivated PODs for {X} removed client(s)"
  - "Updated trip {tripNumber} - Created PODs for {X} new client(s)"
- **Details**: Trip number, added/removed clients count

#### Trip Delete (tripController.js)
- **Kab**: Jab trip delete/cancel hoti hai
- **Log**: "Deleted trip {tripNumber} and deactivated all related records (advances, expenses, payments, PODs). Vehicle and driver marked as available."
- **Details**: Trip number

#### Trip Status Change (tripController.js)
- **Kab**: Jab trip ka status change hota hai
- **Logs**:
  - In Progress: "Started trip {tripNumber}. Vehicle and driver marked as on_trip."
  - Completed: "Completed trip {tripNumber}. Vehicle and driver marked as available."
  - Cancelled: "Cancelled trip {tripNumber}. Vehicle and driver marked as available."
- **Details**: Trip number, status

#### POD Submission (tripController.js)
- **Kab**: Jab POD amount submit hota hai (fleet-owned vehicles ke liye)
- **Log**: "Submitted POD amount ₹{amount} for trip {tripNumber}. Balance: ₹{before} → ₹{after}. Advance created."
- **Details**: Submitted amount, balance before/after, advance ID, trip number

---

### 2. TRIP ADVANCES (tripAdvanceController.js)

#### Advance Create
- **Kab**: Jab trip ke liye advance diya jata hai (fleet owner ya driver ko)
- **Log**: "Added {fleet owner/driver} advance of ₹{amount} to {name} for trip {tripNumber}"
- **Details**: Amount, recipient type, recipient name, trip number

#### Advance Delete
- **Kab**: Jab advance delete hota hai
- **Log**: "Deleted {POD submission/advance} of ₹{amount} to {name}"
- **Details**: Amount, recipient name, advance type

---

### 3. TRIP EXPENSES (tripExpenseController.js)

#### Expense Create
- **Kab**: Jab trip ke liye expense add hota hai
- **Log**: "Added {expenseType} expense of ₹{amount} for {fleet owner/vehicle} in trip {tripNumber}"
- **Details**: Expense type, amount, target (fleet owner/vehicle), trip number

#### Expense Delete
- **Kab**: Jab expense delete hota hai
- **Log**: "Deleted {expenseType} expense of ₹{amount}"
- **Details**: Expense type, amount

---

### 4. CLIENT PAYMENTS (clientPaymentController.js)

#### Payment Create
- **Kab**: Jab client se payment receive hota hai
- **Log**: "Added client payment of ₹{amount} from {clientName} for trip {tripNumber}"
- **Details**: Amount, client name, trip number

#### Payment Delete
- **Kab**: Jab payment delete hota hai
- **Log**: "Deleted client payment of ₹{amount} from {clientName}"
- **Details**: Amount, client name

---

### 5. CLIENT EXPENSES (clientExpenseController.js)

#### Expense Create
- **Kab**: Jab client ke liye expense add hota hai
- **Log**: "Added client expense of ₹{amount} ({expenseType}) for {clientName} in trip {tripNumber}"
- **Details**: Amount, expense type, client name, trip number

#### Expense Delete
- **Kab**: Jab client expense delete hota hai
- **Log**: "Deleted client expense of ₹{amount} ({expenseType}) for {clientName}"
- **Details**: Amount, expense type, client name

---

### 6. CLIENT POD (clientPODController.js)

#### POD Create
- **Kab**: Jab client ke liye POD create hota hai
- **Log**: "Created POD for client {clientName}"
- **Details**: POD ID, client ID, trip ID

#### POD Update
- **Kab**: Jab POD status update hota hai
- **Log**: "Updated POD for client {clientName}"
- **Details**: POD ID, status

#### POD Document Upload
- **Kab**: Jab POD document upload hota hai
- **Log**: "Uploaded {status} document for client {clientName}"
- **Details**: Document ID, status, file URL

#### POD Delete
- **Kab**: Jab POD deactivate hota hai
- **Log**: "Deactivated POD for client {clientName}"
- **Details**: POD ID

#### POD Document Delete
- **Kab**: Jab POD document delete hota hai
- **Log**: "Deleted {status} document for client {clientName}"
- **Details**: Document ID, status

---

### 7. COLLECTION MEMO (collectionMemoController.js)

#### Memo Create
- **Kab**: Jab collection memo create hota hai
- **Log**: "Created collection memo {memoNumber} for {clientName} in trip {tripNumber}"
- **Details**: Memo number, client name, trip number

#### Memo Update
- **Kab**: Jab memo update hota hai
- **Log**: "Updated collection memo {memoNumber} for {clientName}"
- **Details**: Memo number, client name

#### Memo Delete
- **Kab**: Jab memo delete hota hai
- **Log**: "Deleted collection memo {memoNumber} for {clientName}"
- **Details**: Memo number, client name

---

### 8. BALANCE MEMO (balanceMemoController.js)

#### Memo Create
- **Kab**: Jab balance memo create hota hai
- **Log**: "Created balance memo for {clientName} in trip {tripNumber}"
- **Details**: Client name, trip number

#### Memo Update
- **Kab**: Jab memo update hota hai
- **Log**: "Updated balance memo for {clientName}"
- **Details**: Client name

#### Memo Delete
- **Kab**: Jab memo delete hota hai
- **Log**: "Deleted balance memo for {clientName}"
- **Details**: Client name

---

### 9. VEHICLE EXPENSES (expenseController.js)

#### Expense Create
- **Kab**: Jab vehicle ke liye general expense add hota hai
- **Log**: "Added {expenseType} expense of ₹{amount} for vehicle {vehicleNumber}"
- **Details**: Expense type, amount, vehicle number

#### Expense Delete
- **Kab**: Jab expense delete hota hai
- **Log**: "Deleted {expenseType} expense of ₹{amount}"
- **Details**: Expense type, amount

---

### 10. DRIVER CALCULATIONS (driverCalculationController.js)

#### Calculation Create
- **Kab**: Jab driver calculation create hota hai
- **Log**: "Created driver calculation for {driverName} - {X} trips"
- **Details**: Driver name, trip count

#### Calculation Update
- **Kab**: Jab calculation update hota hai
- **Log**: "Updated driver calculation for {driverName}"
- **Details**: Driver name

#### Calculation Delete
- **Kab**: Jab calculation delete hota hai
- **Log**: "Deleted driver calculation for {driverName}"
- **Details**: Driver name

---

## Part 2: Login System - Current Status

### Current Implementation

#### User Model (backend/models/User.js)
```javascript
role: {
  type: String,
  enum: ['admin', 'manager', 'accountant'],
  default: 'manager'
}
```

**Current Roles:**
1. **Admin** - Full access
2. **Manager** - Management access
3. **Accountant** - Financial access

### What's Missing

#### 1. Client Login
- **Status**: NOT IMPLEMENTED
- **Model**: Client model exists but no login functionality
- **Required**:
  - Add password field to Client model
  - Add authentication routes
  - Create client dashboard
  - Show only their trips and PODs

#### 2. Fleet Owner Login
- **Status**: NOT IMPLEMENTED
- **Model**: FleetOwner model exists but no login functionality
- **Required**:
  - Add password field to FleetOwner model
  - Add authentication routes
  - Create fleet owner dashboard
  - Show only their vehicles and trips

#### 3. Driver Login
- **Status**: PARTIALLY IMPLEMENTED
- **Model**: Driver model has password field
- **What Exists**:
  - Password field in model
  - Password hashing (bcrypt)
  - comparePassword method
- **What's Missing**:
  - Login routes
  - Driver dashboard
  - Mobile app/interface

### Current Login Flow (Admin/Manager/Accountant Only)

1. **Login Route**: `POST /api/auth/login`
   - Input: username/email, password
   - Output: JWT token

2. **Register Route**: `POST /api/auth/register`
   - Creates new user (admin/manager/accountant)

3. **Protected Routes**: Use `protect` middleware
   - Checks JWT token
   - Attaches user to req.user

### Activity Log User Tracking

All activity logs save:
- **user**: req.user (logged in user)
- **action**: Description of action
- **actionType**: CREATE/UPDATE/DELETE
- **module**: Which module (Trip, Client, etc.)
- **entityId**: ID of affected entity
- **ipAddress**: User's IP
- **userAgent**: Browser info

---

## Summary

### Activity Logs Save Hote Hain:
1. ✅ Trip operations (create, update, delete, status change)
2. ✅ POD submissions
3. ✅ Advances (trip advances, POD advances)
4. ✅ Expenses (trip expenses, vehicle expenses, client expenses)
5. ✅ Payments (client payments)
6. ✅ POD operations (create, update, upload, delete)
7. ✅ Memos (collection memo, balance memo)
8. ✅ Driver calculations

### Login System Status:
1. ✅ Admin/Manager/Accountant - FULLY WORKING
2. ❌ Client Login - NOT IMPLEMENTED
3. ❌ Fleet Owner Login - NOT IMPLEMENTED
4. ⚠️ Driver Login - PARTIALLY IMPLEMENTED (model ready, routes missing)

### Next Steps for Complete Login System:
1. Add Client login routes and dashboard
2. Add Fleet Owner login routes and dashboard
3. Complete Driver login routes and mobile interface
4. Add role-based permissions for each user type
5. Create separate dashboards for each role
