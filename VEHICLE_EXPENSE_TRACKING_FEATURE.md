# Vehicle Expense Tracking Feature

## Overview
Vehicle Details modal mein Expenses tab ab vehicle ki complete financial summary dikhata hai with export functionality.

---

## Features Implemented

### 1. Financial Summary Cards

**4 Cards Display:**
- **Total Trips** (Blue) - Vehicle ne kitni trips ki
- **Total Income** (Green) - Sabhi trips se total revenue
- **Total Expenses** (Red) - Vehicle ke total expenses
- **Net Profit** (Purple/Orange) - Income - Expenses

### 2. Data Calculation

**Income Calculation:**
```javascript
Total Income = Sum of all trip revenues for this vehicle
```

**Expense Calculation:**
```javascript
Total Expenses = Sum of all vehicle expenses from self-owned trips
```

**Profit Calculation:**
```javascript
Net Profit = Total Income - Total Expenses
```

---

## Export Functionality

### CSV Export
**Features:**
- All transactions (income + expenses) in tabular format
- Date, Trip Number, Type, Description, Amount columns
- Summary section at bottom with totals
- Filename: `{vehicleNumber}_expenses_{date}.csv`

**CSV Format:**
```csv
Date,Trip Number,Type,Description,Amount
"27 Feb 2026","TRP000001","Income","Trip Revenue (1 clients)",80000
"27 Feb 2026","TRP000001","Expense","fuel - Diesel",3000
...
"Total Income","","","",80000
"Total Expenses","","","",3000
"Net Profit","","","",77000
```

### PDF Export
**Features:**
- Professional PDF report with jsPDF
- Summary table with key metrics
- Detailed transactions table
- Auto-table formatting with colors
- Filename: `{vehicleNumber}_expenses_{date}.pdf`

**PDF Structure:**
```
Vehicle Expense Report
Vehicle: MP04SV2148
Date: 27 Feb 2026

Summary
┌─────────────────┬──────────┐
│ Metric          │ Amount   │
├─────────────────┼──────────┤
│ Total Trips     │ 5        │
│ Total Income    │ ₹400,000 │
│ Total Expenses  │ ₹50,000  │
│ Net Profit      │ ₹350,000 │
└─────────────────┴──────────┘

Transactions
┌────────────┬───────────┬─────────┬─────────────┬──────────┐
│ Date       │ Trip      │ Type    │ Description │ Amount   │
├────────────┼───────────┼─────────┼─────────────┼──────────┤
│ 27 Feb 26  │ TRP000001 │ Income  │ Trip Revenue│ ₹80,000  │
│ 27 Feb 26  │ TRP000001 │ Expense │ fuel        │ ₹3,000   │
└────────────┴───────────┴─────────┴─────────────┴──────────┘
```

---

## Recent Transactions Display

**Income Transactions:**
- Green background with green border
- "INCOME" badge (green)
- Trip number and date
- Amount with + prefix

**Expense Transactions:**
- Red background with red border
- "EXPENSE" badge (red)
- Expense type, trip number, description, date
- Amount with - prefix

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [INCOME] TRP000001              +₹80,000   │
│ Trip Revenue • 27 Feb 2026                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ [EXPENSE] fuel                   -₹3,000   │
│ TRP000001 • Diesel • 27 Feb 2026            │
└─────────────────────────────────────────────┘
```

---

## Data Loading

**Process:**
1. Fetch all trips for the vehicle
2. Fetch expenses for each trip
3. Calculate totals
4. Display summary and transactions

**Loading State:**
- Spinner with "Loading vehicle data..." message

**Empty State:**
- "No transactions found" message with icon

---

## Color Scheme

### Summary Cards:
- **Trips**: Blue gradient (`from-blue-50 to-blue-100`)
- **Income**: Green gradient (`from-green-50 to-green-100`)
- **Expenses**: Red gradient (`from-red-50 to-red-100`)
- **Profit**: Purple gradient (positive) / Orange gradient (negative)

### Transactions:
- **Income**: `bg-green-50 border-green-200`
- **Expense**: `bg-red-50 border-red-200`

### Badges:
- **INCOME**: `bg-green-600 text-white`
- **EXPENSE**: `bg-red-600 text-white`

---

## Icons Used (Lucide)

- `Truck` - Total Trips
- `TrendingUp` - Total Income
- `TrendingDown` - Total Expenses
- `DollarSign` - Net Profit
- `Download` - Export buttons
- `Loader` - Loading state
- `FileText` - Empty state

---

## Dependencies Added

```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';
```

**Installation:**
```bash
npm install jspdf jspdf-autotable
```

---

## API Integration

**Endpoints Used:**
- `tripAPI.getAll()` - Get all trips
- `tripExpenseAPI.getByTrip(tripId)` - Get expenses for each trip

**Filtering:**
```javascript
const vehicleTrips = trips.filter(
  trip => trip.vehicleId?._id === vehicle._id && trip.isActive
);
```

---

## Component Structure

```javascript
<VehicleExpensesTab>
  {/* Summary Cards */}
  <div className="grid grid-cols-4">
    <Card>Total Trips</Card>
    <Card>Total Income</Card>
    <Card>Total Expenses</Card>
    <Card>Net Profit</Card>
  </div>

  {/* Export Buttons */}
  <div className="export-section">
    <Button onClick={exportToCSV}>Export CSV</Button>
    <Button onClick={exportToPDF}>Export PDF</Button>
  </div>

  {/* Recent Transactions */}
  <div className="transactions">
    {trips.map(trip => <IncomeCard />)}
    {expenses.map(expense => <ExpenseCard />)}
  </div>
</VehicleExpensesTab>
```

---

## Benefits

✅ **Complete Financial Overview**: Vehicle ki puri financial summary ek jagah
✅ **Export Functionality**: CSV aur PDF mein report download kar sakte hain
✅ **Transaction History**: Sabhi income aur expenses chronologically
✅ **Visual Summary**: Color-coded cards for quick understanding
✅ **Professional Reports**: PDF reports with proper formatting
✅ **Data Accuracy**: Real-time data from trips and expenses

---

## Usage

1. Vehicle list se kisi vehicle par click karo
2. "Expenses" tab par jao
3. Summary cards mein totals dekho
4. "Export CSV" ya "Export PDF" click karke report download karo
5. Recent transactions scroll karke dekho

---

## Summary

Vehicle Expenses tab ab fully functional hai with:
- Financial summary cards
- Income and expense tracking
- CSV export
- PDF export with professional formatting
- Transaction history
- Real-time calculations

Sab kuch properly working hai!
