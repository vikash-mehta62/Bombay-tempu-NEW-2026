# Technology Stack - Next.js + MongoDB

## Selected Stack

### Frontend & Backend
- **Next.js 14+** (App Router)
- **Tailwind CSS** for styling
- **shadcn/ui** for components

### Backend API
- **Node.js + Express.js** (separate API server)
- **MongoDB** with Mongoose
- **JWT** authentication

### Additional Tools
- **Multer** - File uploads
- **Cloudinary** - Image storage
- **Nodemailer** - Email
- **PDFKit** - PDF generation
- **ExcelJS** - Excel export

---

## Project Structure

```
truck-management-system/
│
├── backend/                          # Express API Server
│   ├── config/
│   │   ├── database.js              # MongoDB connection
│   │   ├── cloudinary.js            # Cloudinary config
│   │   └── jwt.js                   # JWT config
│   │
│   ├── models/                      # Mongoose models
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Driver.js
│   │   ├── Client.js
│   │   ├── Trip.js
│   │   ├── Expense.js
│   │   ├── Invoice.js
│   │   ├── Payment.js
│   │   ├── Document.js
│   │   ├── ActivityLog.js           # User activity tracking
│   │   └── Alert.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── vehicleController.js
│   │   ├── driverController.js
│   │   ├── clientController.js
│   │   ├── tripController.js
│   │   ├── expenseController.js
│   │   ├── invoiceController.js
│   │   ├── paymentController.js
│   │   ├── documentController.js
│   │   ├── reportController.js
│   │   └── logController.js         # Activity logs
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vehicles.js
│   │   ├── drivers.js
│   │   ├── clients.js
│   │   ├── trips.js
│   │   ├── expenses.js
│   │   ├── invoices.js
│   │   ├── payments.js
│   │   ├── documents.js
│   │   ├── reports.js
│   │   └── logs.js                  # Activity logs routes
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   ├── roleCheck.js             # Role-based access
│   │   ├── activityLogger.js        # Log user activities
│   │   ├── errorHandler.js
│   │   └── validator.js
│   │
│   ├── utils/
│   │   ├── emailService.js
│   │   ├── pdfGenerator.js
│   │   ├── excelGenerator.js
│   │   └── logger.js
│   │
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/                         # Next.js App
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.jsx
│   │   │   └── layout.jsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.jsx
│   │   │   │
│   │   │   ├── vehicles/
│   │   │   │   ├── page.jsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.jsx
│   │   │   │   └── add/
│   │   │   │       └── page.jsx
│   │   │   │
│   │   │   ├── drivers/
│   │   │   │   ├── page.jsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.jsx
│   │   │   │   └── add/
│   │   │   │       └── page.jsx
│   │   │   │
│   │   │   ├── clients/
│   │   │   │   ├── page.jsx
│   │   │   │   └── add/
│   │   │   │       └── page.jsx
│   │   │   │
│   │   │   ├── trips/
│   │   │   │   ├── page.jsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.jsx
│   │   │   │   └── create/
│   │   │   │       └── page.jsx
│   │   │   │
│   │   │   ├── expenses/
│   │   │   │   ├── page.jsx
│   │   │   │   └── add/
│   │   │   │       └── page.jsx
│   │   │   │
│   │   │   ├── invoices/
│   │   │   │   ├── page.jsx
│   │   │   │   └── create/
│   │   │   │       └── page.jsx
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   └── page.jsx
│   │   │   │
│   │   │   ├── logs/                # Activity logs page
│   │   │   │   └── page.jsx
│   │   │   │
│   │   │   └── layout.jsx
│   │   │
│   │   ├── api/                     # API routes (optional)
│   │   ├── layout.jsx
│   │   └── page.jsx
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   │
│   │   ├── forms/
│   │   │   ├── VehicleForm.jsx
│   │   │   ├── DriverForm.jsx
│   │   │   ├── ClientForm.jsx
│   │   │   ├── TripForm.jsx
│   │   │   └── ExpenseForm.jsx
│   │   │
│   │   ├── tables/
│   │   │   ├── VehicleTable.jsx
│   │   │   ├── DriverTable.jsx
│   │   │   └── TripTable.jsx
│   │   │
│   │   └── charts/
│   │       ├── RevenueChart.jsx
│   │       └── ExpenseChart.jsx
│   │
│   ├── lib/
│   │   ├── api.js                   # Axios instance
│   │   ├── utils.js
│   │   └── constants.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useVehicles.js
│   │   └── useTrips.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── public/
│   ├── .env.local
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
└── README.md
```

---

## MongoDB Schema Design

### User Activity Logs Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Reference to User
  userName: String,              // User's name
  userRole: String,              // User's role
  action: String,                // Action performed
  actionType: String,            // CREATE, READ, UPDATE, DELETE
  module: String,                // vehicles, trips, expenses, etc.
  entityId: ObjectId,            // ID of affected entity
  entityType: String,            // Type of entity
  details: Object,               // Additional details
  ipAddress: String,             // User's IP
  userAgent: String,             // Browser info
  timestamp: Date,               // When action occurred
  changes: {                     // For UPDATE actions
    before: Object,
    after: Object
  }
}
```

---

## Activity Logging Features

### What to Log:
1. **Authentication**
   - Login attempts (success/failed)
   - Logout
   - Password changes

2. **CRUD Operations**
   - Create: New vehicle, driver, trip, etc.
   - Read: View sensitive data
   - Update: Changes to records
   - Delete: Deletion of records

3. **Financial Operations**
   - Invoice creation
   - Payment recording
   - Expense entries

4. **Document Operations**
   - Document uploads
   - Document downloads
   - Document deletions

5. **Report Generation**
   - Which reports generated
   - Date ranges
   - Export actions

### Log Examples:
```javascript
// Login
{
  action: "User logged in",
  actionType: "AUTH",
  module: "authentication",
  details: { loginMethod: "password" }
}

// Create Vehicle
{
  action: "Created new vehicle",
  actionType: "CREATE",
  module: "vehicles",
  entityId: "vehicle_id",
  entityType: "Vehicle",
  details: { vehicleNumber: "MH12AB1234" }
}

// Update Trip
{
  action: "Updated trip status",
  actionType: "UPDATE",
  module: "trips",
  entityId: "trip_id",
  entityType: "Trip",
  changes: {
    before: { status: "scheduled" },
    after: { status: "in_transit" }
  }
}

// Delete Expense
{
  action: "Deleted expense record",
  actionType: "DELETE",
  module: "expenses",
  entityId: "expense_id",
  entityType: "Expense",
  details: { amount: 5000, category: "fuel" }
}
```

---

## Dependencies

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0",
    "nodemailer": "^6.9.7",
    "pdfkit": "^0.13.0",
    "exceljs": "^4.4.0",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "axios": "^1.6.2",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "@tanstack/react-query": "^5.14.2",
    "recharts": "^2.10.3",
    "date-fns": "^3.0.6",
    "lucide-react": "^0.303.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "eslint": "^8",
    "eslint-config-next": "14.0.4"
  }
}
```

---

## Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/truck_management
# Or MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/truck_management

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Truck Management System
```

---

## Key Features

### 1. Activity Logging System
- Automatic logging of all user actions
- Track who did what and when
- Store IP address and browser info
- Track changes (before/after)
- Filter logs by user, date, action type
- Export logs to Excel

### 2. Role-based Access Control
- Owner: Full access
- Manager: Operations only
- Accountant: Financial only
- Dispatcher: Trips only
- Viewer: Read-only

### 3. Real-time Dashboard
- Server-side rendering with Next.js
- Fast page loads
- SEO-friendly
- Responsive design with Tailwind

### 4. File Management
- Upload to Cloudinary
- Automatic optimization
- CDN delivery
- Secure URLs

### 5. API Security
- JWT authentication
- Rate limiting
- Helmet.js security headers
- CORS configuration
- Input validation

---

## Development Workflow

### 1. Setup Backend
```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose bcryptjs jsonwebtoken dotenv cors multer
npm install nodemon --save-dev
```

### 2. Setup Frontend
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install axios react-hook-form zod
```

### 3. Setup MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Create account at mongodb.com/cloud/atlas
```

### 4. Run Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## Next Steps

1. Setup project structure
2. Create MongoDB models
3. Build authentication system
4. Implement activity logging middleware
5. Create API endpoints
6. Build Next.js pages
7. Add Tailwind styling
8. Test and deploy

