# POD Advance Creation Fix

## Issue
POD submit karne par advance create ho raha tha lekin properly link nahi ho raha tha kyunki `historyEntry._id` undefined tha (entry abhi save nahi hui thi).

## Solution
Order change kiya:
1. Pehle advance create karo
2. Trip save karo with podHistory entry (ab entry ko _id milega)
3. Phir advance update karo with podHistoryId

## Changes Made

### backend/controllers/tripController.js - updateActualPodAmt function

**Before:**
```javascript
const advance = await TripAdvance.create({...});
const historyEntry = {...};
advance.podHistoryId = historyEntry._id; // ❌ undefined
await advance.save();
trip.podHistory.push(historyEntry);
await trip.save();
```

**After:**
```javascript
const advance = await TripAdvance.create({
  ...
  isActive: true  // ✅ explicitly set
});

trip.podHistory.push({
  ...
  advanceId: advance._id
});
await trip.save(); // ✅ save first to get _id

const lastHistoryEntry = trip.podHistory[trip.podHistory.length - 1];
advance.podHistoryId = lastHistoryEntry._id; // ✅ now has _id
await advance.save();
```

## Testing Steps

1. Backend restart karo:
   ```bash
   cd backend
   npm start
   ```

2. Trip details page par jao
3. "Manage POD" button click karo
4. Amount enter karo (e.g., 300)
5. Payment type select karo
6. "Submit POD" click karo
7. Advances tab check karo - purple background with "POD" badge dikhna chahiye
8. Delete button disabled hona chahiye advances tab mein
9. POD history modal mein delete button active hona chahiye

## Expected Result
✅ Advance properly create hoga
✅ Advances list mein show hoga with purple styling
✅ Delete button disabled rahega advances tab mein
✅ POD history se delete kar sakte ho
