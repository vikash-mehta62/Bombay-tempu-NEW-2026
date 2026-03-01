# Clients Management Feature

## Overview
Complete client management system with CRUD operations, business information tracking, and credit management.

## Features Implemented

### Backend (Node.js + Express + MongoDB)

#### 1. Client Model (`backend/models/Client.js`)
- **Basic Information**
  - Full Name (required)
  - Company Name (optional, for company type clients)
  - Contact Number (required, unique)
  - Email (optional)
  - Address
  - Client Type (individual/company)

- **Business Information**
  - GST Number (unique, uppercase)
  - PAN Number (unique, uppercase)
  - Billing Address

- **Financial Information**
  - Credit Limit
  - Outstanding Balance (auto-calculated)

- **Security**
  - Password (default: "12345678")
  - Bcrypt hashing for password security
  - Password comparison method

- **Status Management**
  - active
  - inactive
  - blocked

#### 2. Client Controller (`backend/controllers/clientController.js`)
- `getAllClients` - Get all clients with search and status filters
- `getClientById` - Get single client details
- `createClient` - Create new client (auto-sets default password)
- `updateClient` - Update client information
- `deleteClient` - Soft delete (sets isActive to false)
- `getClientStats` - Get client statistics including total outstanding

#### 3. Client Routes (`backend/routes/clients.js`)
- `GET /api/clients` - Get all clients
- `GET /api/clients/stats` - Get client statistics (admin only)
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client (admin only)
- `PUT /api/clients/:id` - Update client (admin only)
- `DELETE /api/clients/:id` - Delete client (admin only)

### Frontend (Next.js 14 + Tailwind CSS)

#### 1. Clients Page (`frontend/app/dashboard/clients/page.js`)
- **Statistics Dashboard**
  - Total Clients count
  - Active clients count
  - Company clients count
  - Total Outstanding balance

- **Search & Filter**
  - Search by name, company, contact, or email
  - Filter by status (active, inactive, blocked)

- **Clients Table**
  - Client details with company name and GST
  - Contact information (phone & email)
  - Client type (individual/company) with icons
  - Credit limit
  - Outstanding balance (color-coded)
  - Status badge with color coding
  - Edit and Delete actions

#### 2. Client Form Modal (`frontend/components/ClientFormModal.js`)
- **Add New Client**
  - Info banner showing default password "12345678"
  - Full form with all client fields
  - Validation for required fields
  - Client type selector (individual/company)

- **Edit Client**
  - Pre-filled form with existing data
  - Update all client information
  - Cannot change password through this form

- **Form Sections**
  1. Client Type Selection
     - Individual
     - Company

  2. Basic Information
     - Full Name (required)
     - Company Name (shown for company type)
     - Contact Number (required)
     - Email
     - Address
     - Status dropdown

  3. Business Information
     - GST Number (auto-uppercase, 15 chars)
     - PAN Number (auto-uppercase, 10 chars)
     - Billing Address
     - Credit Limit

#### 3. API Integration (`frontend/lib/api.js`)
```javascript
export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getStats: () => api.get('/clients/stats'),
};
```

## Default Passwords Summary

All user types now have default password: **12345678**

1. **Drivers** - Default password: 12345678
2. **Fleet Owners** - Default password: 12345678
3. **Clients** - Default password: 12345678

## Status Color Coding
- **Active**: Green badge
- **Inactive**: Gray badge
- **Blocked**: Red badge

## Security Features
- Password hashing with bcrypt
- JWT authentication required for all routes
- Admin-only access for create, update, delete operations
- Soft delete (preserves data, sets isActive to false)
- Passwords excluded from API responses

## Activity Logging
All client operations are logged in the activity log system:
- Client creation
- Client updates
- Client deletion
- Module: 'clients'

## Navigation
- Accessible from sidebar: Dashboard → Clients
- Route: `/dashboard/clients`
- Icon: Users

## Usage

### Add New Client
1. Click "Add Client" button
2. Select client type (Individual/Company)
3. Fill in required fields (Full Name, Contact Number)
4. Optionally add email, address, GST, PAN, credit limit
5. Click "Add Client"
6. Default password "12345678" is automatically set
7. Success toast shows confirmation

### Edit Client
1. Click edit icon on client row
2. Update any information
3. Click "Update Client"
4. Success toast shows confirmation

### Delete Client
1. Click delete icon on client row
2. Confirm deletion
3. Client is soft-deleted (isActive = false, status = inactive)

### Search Clients
- Type in search box to filter by name, company, contact, or email
- Real-time filtering

### Filter by Status
- Use status dropdown to filter clients
- Options: All, Active, Inactive, Blocked

## Database Schema
```javascript
{
  fullName: String (required),
  companyName: String,
  contact: String (required, unique),
  email: String,
  address: String,
  gstNumber: String (unique, uppercase),
  panNumber: String (unique, uppercase),
  password: String (hashed, default: "12345678"),
  billingAddress: String,
  creditLimit: Number (default: 0),
  outstandingBalance: Number (default: 0),
  status: String (enum: active, inactive, blocked),
  clientType: String (enum: individual, company),
  isActive: Boolean (default: true),
  timestamps: true
}
```

## Financial Tracking
- Credit Limit: Maximum credit allowed for the client
- Outstanding Balance: Current unpaid amount
- Color-coded display:
  - Green: No outstanding (₹0)
  - Orange: Has outstanding balance

## Future Enhancements
- Invoice generation for clients
- Payment history tracking
- Trip history per client
- Credit limit alerts
- Outstanding payment reminders
- Client portal for self-service
- Document uploads (GST certificate, PAN card)
- Client performance analytics
- Automated billing
