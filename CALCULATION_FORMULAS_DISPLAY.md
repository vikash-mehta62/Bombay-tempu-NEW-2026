# Calculation Formulas Display Feature

## Overview
Trip Information section mein har calculation ke niche formula display hoga, taaki user samajh sake ki calculation kaise ho rahi hai.

---

## Formulas Added

### 1. Total Freight

**Fleet-Owned Vehicle:**
```
Formula: Hire Cost + Expenses
Example: ₹40,000 + ₹3,000 = ₹43,000
```

**Self-Owned Vehicle:**
```
Formula: Sum of all client rates
Example: ₹42,000 (total client revenue)
```

---

### 2. Commission (Fleet-Owned Only)

**Display:**
```
Type: From Fleet Owner (-) / To Fleet Owner (+) / None
Example: From Fleet Owner (-) ₹2,000
```

**Explanation:**
- From Fleet Owner: Commission deducted from fleet owner payment (reduces profit)
- To Fleet Owner: Commission added to fleet owner payment (increases profit)
- None: No commission

---

### 3. POD (Fleet-Owned Only)

**Display:**
```
Remaining / Original (Deducted from fleet owner payment)
Example: ₹1,000 / ₹1,000
```

**Explanation:**
- Remaining: Current POD balance (podBalance)
- Original: Initial POD amount (actualPodAmt)
- POD is deducted from fleet owner payment

---

### 4. Paid Balance (Fleet-Owned Only)

**Display:**
```
Total advances paid to fleet owner
Example: ₹0
```

**Explanation:**
- Sum of all advances given to fleet owner
- Includes manual advances and POD submission advances

---

### 5. Pending Balance (Fleet-Owned Only)

**Formula:**
```
Pending Balance = (Hire Cost + Expenses) - Commission - POD - Advances
```

**Example Calculation:**
```
= (₹40,000 + ₹3,000) - ₹2,000 - ₹1,000 - ₹0
= ₹43,000 - ₹2,000 - ₹1,000 - ₹0
= ₹40,000
```

**Display:**
- Blue text: Formula
- Gray text: Actual values with calculation

---

### 6. Profit / Loss

**Fleet-Owned Vehicle Formula:**
```
Profit/Loss = Revenue - Hire Cost - Adjustments ± Commission + POD
```

**Example Calculation:**
```
= ₹42,000 - ₹40,000 - ₹0 + ₹2,000 + ₹1,000
= ₹5,000
```

**Commission Logic:**
- From Fleet Owner: Add to profit (+)
- To Fleet Owner: Subtract from profit (-)
- None: No effect

**Self-Owned Vehicle Formula:**
```
Profit/Loss = Revenue - Adjustments
```

**Example Calculation:**
```
= ₹42,000 - ₹0
= ₹42,000
```

---

## UI Implementation

### Display Format

Each calculation shows:
1. **Label and Value** (main display)
2. **Formula** (blue italic text)
3. **Actual Calculation** (gray text with real values)

### Example Display:

```
Pending Balance                    ₹40,000
Formula: (Hire + Expenses) - Commission - POD - Advances
= (₹40,000 + ₹3,000) - ₹2,000 - ₹1,000 - ₹0
```

---

## Code Structure

```javascript
<div>
  {/* Main Display */}
  <div className="flex justify-between">
    <span className="text-sm font-semibold">Pending Balance</span>
    <span className="text-sm font-semibold">
      {formatCurrency(fleetOwnerBalance)}
    </span>
  </div>
  
  {/* Formula */}
  <p className="text-xs text-blue-600 mt-1 italic font-medium">
    Formula: (Hire + Expenses) - Commission - POD - Advances
  </p>
  
  {/* Actual Calculation */}
  <p className="text-xs text-gray-500 mt-1">
    = ({formatCurrency(hireTotal)} + {formatCurrency(totalExpenses)}) 
    - {formatCurrency(commission)} 
    - {formatCurrency(balancePOD)} 
    - {formatCurrency(totalAdvances)}
  </p>
</div>
```

---

## Benefits

✅ **Transparency**: Users can see exactly how calculations are done
✅ **Understanding**: Clear formulas help users understand the system
✅ **Verification**: Users can verify calculations manually
✅ **Trust**: Builds confidence in the system's accuracy
✅ **Learning**: New users can learn the calculation logic

---

## Conditional Display

### Fleet-Owned Vehicle Shows:
- Total Freight (with Hire + Expenses formula)
- Commission (with type)
- POD (Remaining / Original)
- Paid Balance (Total advances)
- Pending Balance (with full formula)
- Profit/Loss (with complex formula)

### Self-Owned Vehicle Shows:
- Total Freight (Sum of client rates)
- Profit/Loss (Simple formula: Revenue - Adjustments)

---

## Color Coding

- **Blue Text**: Formulas (important information)
- **Gray Text**: Actual calculations (supporting details)
- **Green Text**: Positive profit
- **Red Text**: Loss

---

## Summary

Har calculation ke niche formula aur actual values ke saath calculation display hogi. Users ko pata chalega ki kaise calculation ho rahi hai aur verify bhi kar sakte hain!
