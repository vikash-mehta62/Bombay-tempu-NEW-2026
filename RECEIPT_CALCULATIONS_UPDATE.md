# Receipt Calculations Update

## Overview
Updated the receipt to show complete financial calculations matching the Trip Information display.

## Financial Calculations Added

### 1. Total Fleet Owner Payment
```
Total Fleet Owner Payment = Total Freight + Total Expenses
```
This is the total amount owed to the fleet owner (hire charges + expenses).

### 2. Pending Balance
```
Pending Balance = Total Fleet Owner Payment - Total Advances
```
This shows how much is still pending to be paid to the fleet owner.

### 3. Final Amount (Profit/Loss)
```
Final Amount = Total Fleet Owner Payment - Total Advances - Commission - Balance POD
```
This is the final amount after all deductions:
- Positive value = Profit (shown in green/blue)
- Negative value = Loss (shown in red)

## Receipt Sections Updated

### 1. Fleet Owner Section (Preview Modal)
Added three financial summary cards showing:
- **Total Fleet Owner**: Green card with total payment (Hire + Expenses)
- **Pending Balance**: Orange card with amount to be paid
- **Profit/Loss**: Blue (profit) or Red (loss) card with final amount

### 2. Fleet Owner Section (PDF)
Added three colored boxes showing the same financial summary:
- Light green box for Total Fleet Owner
- Light orange box for Pending Balance
- Light blue (profit) or light red (loss) box for Final Amount

### 3. Final Summary Section
Updated to show detailed breakdown:
- **Total Fright / Expance**: Main total with sub-items
  - • Freight: Individual freight amount
  - • Expenses: Individual expenses amount
- **Commission**: Commission deducted
- **Blance POD**: Balance POD deducted
- **Total Paid**: Total advances paid
- **Pending Balance**: Amount still pending (in orange)
- **Final Amount**: Final profit/loss (in green/red)

## Visual Improvements

### Preview Modal:
- Color-coded cards for quick understanding
- Green for positive amounts
- Orange for pending amounts
- Blue/Red for profit/loss
- Currency formatting with ₹ symbol
- Clear labels and descriptions

### PDF:
- Colored boxes with borders
- Professional layout
- Color-coded text (green, orange, blue/red)
- Proper spacing and alignment
- Currency formatting

## Calculation Flow

1. **Calculate Total Freight**: Sum of all client freight amounts
2. **Calculate Total Expenses**: Sum of all trip expenses
3. **Calculate Total Advances**: Sum of all advance payments
4. **Calculate Total Fleet Owner Payment**: Freight + Expenses
5. **Calculate Pending Balance**: Total Payment - Advances
6. **Calculate Final Amount**: Total Payment - Advances - Commission - Balance POD

## Example Calculation

Given:
- Total Freight: ₹50,000
- Total Expenses: ₹5,200
- Total Advances: ₹2,000
- Commission: ₹0
- Balance POD: ₹0

Results:
- Total Fleet Owner Payment: ₹55,200 (50,000 + 5,200)
- Pending Balance: ₹53,200 (55,200 - 2,000)
- Final Amount: ₹53,200 (55,200 - 2,000 - 0 - 0)

## Files Modified

1. `frontend/components/ReceiptPreviewModal.js`:
   - Added financial calculations
   - Added summary cards
   - Updated Final Summary section
   - Added color coding for profit/loss

2. `frontend/lib/receiptGenerator.js`:
   - Added formatCurrency helper function
   - Added financial summary boxes
   - Updated Final Summary section
   - Added color coding in PDF

## Benefits

1. **Complete Financial Picture**: Shows all calculations clearly
2. **Easy to Understand**: Color-coded for quick comprehension
3. **Matches Trip Info**: Consistent with main trip display
4. **Professional Look**: Clean, organized layout
5. **Accurate Calculations**: All amounts properly calculated and displayed
