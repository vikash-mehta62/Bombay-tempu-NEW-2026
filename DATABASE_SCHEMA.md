# Database Schema - Truck Management System

## Complete Database Design

---

## 1. USERS Table
System users (owner, managers, accountants, etc.)

```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    role ENUM('owner', 'manager', 'accountant', 'dispatcher', 'viewer') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 2. VEHICLES Table
All trucks/vehicles in the fleet

```sql
CREATE TABLE vehicles (
    vehicle_id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type ENUM('truck', 'trailer', 'tanker', 'container', 'other') NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    year INT,
    capacity_tons DECIMAL(10,2),
    fuel_type ENUM('diesel', 'petrol', 'cng', 'electric') DEFAULT 'diesel',
    ownership_type ENUM('owned', 'leased', 'hired') DEFAULT 'owned',
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    current_status ENUM('available', 'on_trip', 'maintenance', 'breakdown', 'sold') DEFAULT 'available',
    current_odometer INT DEFAULT 0,
    chassis_number VARCHAR(50),
    engine_number VARCHAR(50),
    
    -- Document Details
    rc_number VARCHAR(50),
    rc_expiry_date DATE,
    insurance_number VARCHAR(50),
    insurance_expiry_date DATE,
    insurance_company VARCHAR(100),
    permit_number VARCHAR(50),
    permit_expiry_date DATE,
    fitness_expiry_date DATE,
    pollution_expiry_date DATE,
    road_tax_expiry_date DATE,
    
    -- GPS Tracking
    gps_device_id VARCHAR(50),
    last_known_location VARCHAR(255),
    last_location_update TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 3. DRIVERS Table
All drivers information

```sql
CREATE TABLE drivers (
    driver_id INT PRIMARY KEY AUTO_INCREMENT,
    driver_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    alternate_phone VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    
    -- Documents
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_type VARCHAR(20),
    license_expiry_date DATE,
    aadhar_number VARCHAR(12),
    pan_number VARCHAR(10),
    
    -- Employment
    date_of_joining DATE,
    employment_type ENUM('permanent', 'contract', 'daily_wage') DEFAULT 'permanent',
    salary_type ENUM('monthly', 'per_trip', 'daily') DEFAULT 'monthly',
    base_salary DECIMAL(10,2),
    
    -- Bank Details
    bank_name VARCHAR(100),
    account_number VARCHAR(30),
    ifsc_code VARCHAR(15),
    
    -- Status
    current_status ENUM('available', 'on_trip', 'on_leave', 'inactive') DEFAULT 'available',
    assigned_vehicle_id INT,
    
    -- Performance
    total_trips_completed INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(vehicle_id)
);
```

---

## 4. CLIENTS Table
Customer/client information

```sql
CREATE TABLE clients (
    client_id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150),
    client_type ENUM('individual', 'company') DEFAULT 'company',
    
    -- Contact Details
    contact_person VARCHAR(100),
    phone VARCHAR(15) NOT NULL,
    alternate_phone VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    
    -- Business Details
    gstin VARCHAR(15),
    pan_number VARCHAR(10),
    
    -- Payment Terms
    credit_days INT DEFAULT 0,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms TEXT,
    
    -- Rates
    default_rate_per_ton DECIMAL(10,2),
    default_rate_per_km DECIMAL(10,2),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    total_outstanding DECIMAL(12,2) DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 5. TRIPS Table
All trip/load records

```sql
CREATE TABLE trips (
    trip_id INT PRIMARY KEY AUTO_INCREMENT,
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Basic Details
    client_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    
    -- Route Details
    origin VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    distance_km DECIMAL(10,2),
    
    -- Load Details
    load_type VARCHAR(100),
    load_weight_tons DECIMAL(10,2),
    load_quantity INT,
    load_description TEXT,
    
    -- Dates
    trip_date DATE NOT NULL,
    loading_date DATETIME,
    departure_date DATETIME,
    arrival_date DATETIME,
    unloading_date DATETIME,
    
    -- Financial
    freight_amount DECIMAL(12,2) NOT NULL,
    advance_paid_to_driver DECIMAL(10,2) DEFAULT 0,
    diesel_amount DECIMAL(10,2) DEFAULT 0,
    toll_charges DECIMAL(10,2) DEFAULT 0,
    loading_charges DECIMAL(10,2) DEFAULT 0,
    unloading_charges DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(12,2) DEFAULT 0,
    profit_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Documents
    lr_number VARCHAR(50),
    pod_uploaded BOOLEAN DEFAULT FALSE,
    invoice_generated BOOLEAN DEFAULT FALSE,
    
    -- Status
    trip_status ENUM('scheduled', 'loading', 'in_transit', 'unloading', 'completed', 'cancelled') DEFAULT 'scheduled',
    
    -- Odometer
    start_odometer INT,
    end_odometer INT,
    
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

---

## 6. EXPENSES Table
All types of expenses

```sql
CREATE TABLE expenses (
    expense_id INT PRIMARY KEY AUTO_INCREMENT,
    expense_date DATE NOT NULL,
    
    -- Category
    expense_category ENUM(
        'fuel',
        'maintenance',
        'repairs',
        'spare_parts',
        'toll',
        'driver_salary',
        'driver_advance',
        'insurance',
        'permit_tax',
        'office_expense',
        'staff_salary',
        'rent',
        'utilities',
        'miscellaneous'
    ) NOT NULL,
    
    -- Related Entities
    vehicle_id INT,
    driver_id INT,
    trip_id INT,
    vendor_name VARCHAR(100),
    
    -- Amount
    amount DECIMAL(12,2) NOT NULL,
    payment_mode ENUM('cash', 'bank_transfer', 'cheque', 'upi', 'card') DEFAULT 'cash',
    
    -- Details
    description TEXT,
    bill_number VARCHAR(50),
    bill_image_path VARCHAR(255),
    
    -- Fuel Specific
    fuel_quantity_liters DECIMAL(10,2),
    fuel_rate_per_liter DECIMAL(10,2),
    odometer_reading INT,
    
    -- Payment Status
    payment_status ENUM('paid', 'pending', 'partial') DEFAULT 'paid',
    paid_amount DECIMAL(12,2),
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

---

## 7. INVOICES Table
Client billing/invoices

```sql
CREATE TABLE invoices (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    
    client_id INT NOT NULL,
    trip_id INT,
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    cgst_percent DECIMAL(5,2) DEFAULT 0,
    cgst_amount DECIMAL(12,2) DEFAULT 0,
    sgst_percent DECIMAL(5,2) DEFAULT 0,
    sgst_amount DECIMAL(12,2) DEFAULT 0,
    igst_percent DECIMAL(5,2) DEFAULT 0,
    igst_amount DECIMAL(12,2) DEFAULT 0,
    other_charges DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Payment
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    outstanding_amount DECIMAL(12,2),
    due_date DATE,
    
    -- Documents
    invoice_file_path VARCHAR(255),
    
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

---

## 8. PAYMENTS_RECEIVED Table
Payments received from clients

```sql
CREATE TABLE payments_received (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_date DATE NOT NULL,
    
    client_id INT NOT NULL,
    invoice_id INT,
    
    amount DECIMAL(12,2) NOT NULL,
    payment_mode ENUM('cash', 'bank_transfer', 'cheque', 'upi', 'card') NOT NULL,
    
    -- Payment Details
    transaction_reference VARCHAR(100),
    bank_name VARCHAR(100),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

---

## 9. DRIVER_PAYMENTS Table
Payments made to drivers (salary, advances)

```sql
CREATE TABLE driver_payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_date DATE NOT NULL,
    
    driver_id INT NOT NULL,
    trip_id INT,
    
    payment_type ENUM('salary', 'advance', 'incentive', 'trip_payment', 'settlement') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('cash', 'bank_transfer', 'upi') DEFAULT 'cash',
    
    -- Period (for salary)
    payment_month INT,
    payment_year INT,
    
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

---

## 10. DOCUMENTS Table
Document storage and tracking

```sql
CREATE TABLE documents (
    document_id INT PRIMARY KEY AUTO_INCREMENT,
    
    document_type ENUM(
        'vehicle_rc',
        'vehicle_insurance',
        'vehicle_permit',
        'vehicle_fitness',
        'vehicle_pollution',
        'driver_license',
        'driver_aadhar',
        'driver_pan',
        'trip_lr',
        'trip_pod',
        'expense_bill',
        'invoice',
        'client_agreement',
        'other'
    ) NOT NULL,
    
    -- Related Entity
    entity_type ENUM('vehicle', 'driver', 'trip', 'expense', 'invoice', 'client') NOT NULL,
    entity_id INT NOT NULL,
    
    document_name VARCHAR(150) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size_kb INT,
    
    -- Expiry Tracking
    issue_date DATE,
    expiry_date DATE,
    
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);
```

---

## 11. MAINTENANCE_RECORDS Table
Vehicle maintenance history

```sql
CREATE TABLE maintenance_records (
    maintenance_id INT PRIMARY KEY AUTO_INCREMENT,
    
    vehicle_id INT NOT NULL,
    maintenance_date DATE NOT NULL,
    maintenance_type ENUM('routine_service', 'repair', 'breakdown', 'inspection') NOT NULL,
    
    odometer_reading INT,
    service_center VARCHAR(150),
    
    description TEXT,
    parts_replaced TEXT,
    
    cost DECIMAL(10,2),
    next_service_date DATE,
    next_service_odometer INT,
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

---

## 12. ALERTS Table
System alerts and notifications

```sql
CREATE TABLE alerts (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    
    alert_type ENUM(
        'document_expiry',
        'payment_due',
        'maintenance_due',
        'low_fuel',
        'driver_license_expiry',
        'vehicle_insurance_expiry',
        'other'
    ) NOT NULL,
    
    alert_priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    entity_type ENUM('vehicle', 'driver', 'client', 'trip', 'system'),
    entity_id INT,
    
    alert_message TEXT NOT NULL,
    alert_date DATE NOT NULL,
    
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Indexes for Performance

```sql
-- Vehicles
CREATE INDEX idx_vehicle_status ON vehicles(current_status);
CREATE INDEX idx_vehicle_number ON vehicles(vehicle_number);

-- Drivers
CREATE INDEX idx_driver_status ON drivers(current_status);
CREATE INDEX idx_driver_phone ON drivers(phone);

-- Clients
CREATE INDEX idx_client_name ON clients(client_name);
CREATE INDEX idx_client_active ON clients(is_active);

-- Trips
CREATE INDEX idx_trip_date ON trips(trip_date);
CREATE INDEX idx_trip_status ON trips(trip_status);
CREATE INDEX idx_trip_client ON trips(client_id);
CREATE INDEX idx_trip_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trip_driver ON trips(driver_id);

-- Expenses
CREATE INDEX idx_expense_date ON expenses(expense_date);
CREATE INDEX idx_expense_category ON expenses(expense_category);
CREATE INDEX idx_expense_vehicle ON expenses(vehicle_id);

-- Invoices
CREATE INDEX idx_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoice_client ON invoices(client_id);
CREATE INDEX idx_invoice_status ON invoices(payment_status);

-- Payments
CREATE INDEX idx_payment_date ON payments_received(payment_date);
CREATE INDEX idx_payment_client ON payments_received(client_id);
```

---

## Sample Queries

### 1. Get all available vehicles
```sql
SELECT * FROM vehicles 
WHERE current_status = 'available' AND is_active = TRUE;
```

### 2. Get trips for a specific month
```sql
SELECT t.*, c.client_name, v.vehicle_number, d.driver_name
FROM trips t
JOIN clients c ON t.client_id = c.client_id
JOIN vehicles v ON t.vehicle_id = v.vehicle_id
JOIN drivers d ON t.driver_id = d.driver_id
WHERE MONTH(t.trip_date) = 1 AND YEAR(t.trip_date) = 2026
ORDER BY t.trip_date DESC;
```

### 3. Calculate monthly profit
```sql
SELECT 
    SUM(freight_amount) as total_revenue,
    SUM(total_expenses) as total_expenses,
    SUM(profit_amount) as total_profit
FROM trips
WHERE MONTH(trip_date) = 1 AND YEAR(trip_date) = 2026
AND trip_status = 'completed';
```

### 4. Get vehicle-wise expenses
```sql
SELECT 
    v.vehicle_number,
    e.expense_category,
    SUM(e.amount) as total_expense
FROM expenses e
JOIN vehicles v ON e.vehicle_id = v.vehicle_id
WHERE MONTH(e.expense_date) = 1 AND YEAR(e.expense_date) = 2026
GROUP BY v.vehicle_number, e.expense_category;
```

### 5. Get outstanding payments from clients
```sql
SELECT 
    c.client_name,
    SUM(i.outstanding_amount) as total_outstanding
FROM invoices i
JOIN clients c ON i.client_id = c.client_id
WHERE i.payment_status != 'paid'
GROUP BY c.client_name
ORDER BY total_outstanding DESC;
```

### 6. Documents expiring in next 30 days
```sql
SELECT 
    document_type,
    entity_type,
    entity_id,
    document_name,
    expiry_date,
    DATEDIFF(expiry_date, CURDATE()) as days_remaining
FROM documents
WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY expiry_date;
```

