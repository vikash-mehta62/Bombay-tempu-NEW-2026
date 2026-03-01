# Manage POD Feature - Complete Implementation ✅

## Overview
Added "Manage POD" functionality to submit actual POD amount and display it alongside the original POD amount in trip details.

## Features Implemented

### 1. ✅ Manage POD Button
**Location**: Trip details page header (top right)
**Functionality**: Opens modal to enter actual POD amount

### 2. ✅ Manage POD Modal
**Fields**:
- Current POD Amount (read-only, shows trip.podBalance)
- Actual POD Amount (input field)
- Payment Type (dropdown - optional)
- Notes (textarea - optional)

**Actions**:
- Cancel: Closes modal
- Save: Submits actual POD amount

### 3. ✅ POD Display Format
**Location**: Trip Information section (right column)
**Format**: `₹POD / ₹actualPodAmt`
**Example**: `₹50,000 / ₹48,000`

## Implementation Details

### Backend Changes

#### 1. Trip Model (`backend/models/Trip.js`)
Added new field:
```javascript
actualPodAmt: {
  type: Number,
  default: 0
}
```

#### 2. Trip Controller (`backend/controllers/tripController.js`)
Added new function:
```javascript
exports.updateActualPodAmt = async (req, res) => {
  // Updates actualPodAmt field
  // Logs activity
  // Returns updated trip
}
```

#### 3. Trip Routes (`backend/routes/trips.js`)
Added new route:
```javascript
PATCH /api/trips/:id/actual-pod
Body: { actualPodAmt: number }
```

### Frontend Changes

#### 1. API (`frontend/lib/api.js`)
Added function:
```javascript
updateActualPod: (id, actualPodAmt) => 
  api.patch(`/trips/${id}/actual-pod`, { actualPodAmt })
```

#### 2. Trip Details Page (`frontend/app/dashboard/trips/[id]/page.js`)

**New States**:
```javascript
const [showManagePODModal, setShowManagePODModal] = useState(false);
const [actualPodForm, setActualPodForm] = useState({ actualPodAmt: 0 });
```

**New Functions**:
```javascript
handleOpenManagePODModal()
// Opens modal, pre-fills with current actualPodAmt

handleSubmitActualPOD(e)
// Submits actualPodAmt to API
// Shows success/error toast
// Reloads trip details
```

**UI Updates**:
- Added "Manage POD" button in header
- Added Manage POD modal component
- Updated POD display to show: `₹POD / ₹actualPodAmt`

## UI Flow

### Opening Manage POD Modal
```
1. User clicks "Manage POD" button (purple, top right)
2. Modal opens with:
   - Trip number in subtitle
   - Current POD amount (read-only)
   - Actual POD amount input (editable)
   - Payment type dropdown
   - Notes textarea
3. User enters actual POD amount
4. User clicks "Save"
5. API call updates trip
6. Success toast shown
7. Modal closes
8. Trip details reload
9. POD display updates to show new format
```

### POD Display
```
Before: POD: ₹50,000
After:  POD: ₹50,000 / ₹48,000
              ↑         ↑
         podBalance  actualPodAmt
```

## Modal Design

```
┌─────────────────────────────────────────┐
│ 💰 POD Details                    [X]   │
├─────────────────────────────────────────┤
│ Enter POD payment details for trip      │
│ #TRP26020099                            │
│                                         │
│ Current POD Amount                      │
│ [₹50,000] (disabled)                    │
│                                         │
│ Actual POD Amount (₹)                   │
│ [48000]                                 │
│                                         │
│ Payment Type                            │
│ [Select Payment Type ▼]                 │
│                                         │
│ Optional notes                          │
│ [                                    ]  │
│ [                                    ]  │
│                                         │
│ [Cancel]              [Save]            │
└─────────────────────────────────────────┘
```

## Example Scenarios

### Scenario 1: POD Deduction
- Original POD: ₹50,000
- Actual POD: ₹48,000
- Difference: ₹2,000 (deducted)
- Display: `₹50,000 / ₹48,000`

### Scenario 2: No Deduction
- Original POD: ₹50,000
- Actual POD: ₹50,000
- Difference: ₹0
- Display: `₹50,000 / ₹50,000`

### Scenario 3: Extra Amount
- Original POD: ₹50,000
- Actual POD: ₹52,000
- Difference: +₹2,000 (extra)
- Display: `₹50,000 / ₹52,000`

## Button Styling

**Manage POD Button**:
- Color: Purple (`bg-purple-600`)
- Icon: Wallet
- Position: Header, before Edit Trip button
- Hover: Darker purple (`hover:bg-purple-700`)

## API Endpoint

### Update Actual POD Amount
```
PATCH /api/trips/:id/actual-pod
Authorization: Bearer token
Content-Type: application/json

Request Body:
{
  "actualPodAmt": 48000
}

Response:
{
  "success": true,
  "message": "Actual POD amount updated successfully",
  "data": {
    // Updated trip object
    "actualPodAmt": 48000,
    ...
  }
}
```

## Activity Logging

Every actualPodAmt update is logged:
```javascript
{
  action: "Updated actual POD amount to ₹48,000 for trip TRP26020099",
  actionType: "UPDATE",
  module: "Trip",
  entityId: tripId,
  entityType: "Trip",
  details: {
    actualPodAmt: 48000,
    tripNumber: "TRP26020099"
  }
}
```

## Benefits

1. **Clear Visibility**: See both original and actual POD amounts
2. **Easy Submission**: Simple modal for entering actual amount
3. **Audit Trail**: All changes logged
4. **Flexible**: Can handle deductions, exact matches, or extra amounts
5. **User-Friendly**: Intuitive UI with clear labels

## Testing Checklist

- [x] Manage POD button appears in header
- [x] Modal opens on button click
- [x] Current POD amount shows correctly
- [x] Actual POD amount can be entered
- [x] Save button submits data
- [x] Success toast appears
- [x] Trip details reload
- [x] POD display shows format: ₹POD / ₹actualPodAmt
- [x] Activity log created
- [x] Cancel button closes modal

## Files Modified

### Backend
- `backend/models/Trip.js` - Added actualPodAmt field
- `backend/controllers/tripController.js` - Added updateActualPodAmt function
- `backend/routes/trips.js` - Added PATCH route

### Frontend
- `frontend/lib/api.js` - Added updateActualPod function
- `frontend/app/dashboard/trips/[id]/page.js` - Added button, modal, and display

---

**Status**: ✅ Complete
**Feature**: Manage POD with actual amount submission
**Display**: ₹POD / ₹actualPodAmt format
