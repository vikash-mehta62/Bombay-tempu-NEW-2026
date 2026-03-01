# Truck Management System - Frontend

Modern Next.js frontend with Tailwind CSS for the Truck Management System.

## Features

- ✅ Next.js 14 with App Router
- ✅ Tailwind CSS for styling
- ✅ JWT Authentication
- ✅ Protected Routes
- ✅ Activity Logs Viewer
- ✅ Vehicle Management
- ✅ Responsive Design
- ✅ Toast Notifications
- ✅ Excel Export
- ✅ Real-time Dashboard

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod
- **State Management**: React Context
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Truck Management System
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend will run on: http://localhost:3000

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.js
│   ├── dashboard/
│   │   ├── vehicles/
│   │   │   └── page.js
│   │   ├── logs/
│   │   │   └── page.js
│   │   ├── layout.js
│   │   └── page.js
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── Sidebar.js
│   └── Navbar.js
├── context/
│   └── AuthContext.js
├── lib/
│   ├── api.js
│   └── utils.js
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Pages

### Authentication
- `/login` - Login page with demo credentials

### Dashboard
- `/dashboard` - Main dashboard with stats and recent activity
- `/dashboard/vehicles` - Vehicle list and management
- `/dashboard/logs` - Activity logs viewer with filters and export

### Coming Soon
- `/dashboard/drivers` - Driver management
- `/dashboard/clients` - Client management
- `/dashboard/trips` - Trip management
- `/dashboard/expenses` - Expense tracking
- `/dashboard/invoices` - Invoice generation
- `/dashboard/reports` - Reports and analytics

## Features Implemented

### 1. Authentication
- Login with username/password
- JWT token storage
- Auto-redirect on auth
- Logout functionality

### 2. Dashboard
- Vehicle statistics
- Recent activity feed
- Quick actions
- Status overview

### 3. Vehicle Management
- List all vehicles
- Search and filter
- Status badges
- CRUD operations (view, edit, delete)

### 4. Activity Logs ⭐
- View all user activities
- Filter by:
  - Module (vehicles, trips, etc.)
  - Action type (CREATE, UPDATE, DELETE, etc.)
  - Date range
- Statistics cards
- Export to Excel
- Real-time updates
- User information display
- IP address tracking

## Components

### Layout Components
- **Sidebar**: Navigation menu with icons
- **Navbar**: Search bar, notifications, user menu

### Utility Components
- **AuthProvider**: Authentication context
- **Toast**: Notification system

## API Integration

All API calls are centralized in `lib/api.js`:

```javascript
import { authAPI, vehicleAPI, logsAPI } from '@/lib/api';

// Login
const result = await authAPI.login({ username, password });

// Get vehicles
const vehicles = await vehicleAPI.getAll();

// Get activity logs
const logs = await logsAPI.getAll({ module: 'vehicles' });

// Export logs
const blob = await logsAPI.export({ startDate, endDate });
```

## Styling

### Tailwind Utilities

Custom classes defined in `globals.css`:

```css
.btn - Base button
.btn-primary - Primary button
.btn-secondary - Secondary button
.card - Card container
.input - Input field
.label - Form label
.badge - Status badge
```

### Status Colors

```javascript
import { getStatusColor, getActionTypeColor } from '@/lib/utils';

// Vehicle status
<span className={getStatusColor('available')}>Available</span>

// Action type
<span className={getActionTypeColor('CREATE')}>CREATE</span>
```

## Utilities

### Date Formatting

```javascript
import { formatDate, formatDateTime } from '@/lib/utils';

formatDate(date); // "26 Feb 2026"
formatDateTime(date); // "26 Feb 2026, 10:30 AM"
```

### Currency Formatting

```javascript
import { formatCurrency } from '@/lib/utils';

formatCurrency(50000); // "₹50,000"
```

### File Download

```javascript
import { downloadFile } from '@/lib/utils';

downloadFile(blob, 'filename.xlsx');
```

## Authentication Flow

1. User enters credentials on `/login`
2. Frontend calls `authAPI.login()`
3. Backend returns JWT token
4. Token stored in localStorage
5. Token added to all API requests via interceptor
6. Protected routes check authentication
7. Auto-redirect to login if unauthorized

## Activity Logging

The frontend displays all activities logged by the backend:

- User login/logout
- Vehicle CRUD operations
- Trip updates
- Expense entries
- Invoice generation
- Report exports

Each log shows:
- Timestamp
- User name and role
- Action description
- Module
- Action type
- IP address

## Building for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

1. Build the app: `npm run build`
2. Upload `.next` folder and `package.json`
3. Set environment variables
4. Run `npm start`

## Environment Variables

```env
# API URL (required)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# App Name (optional)
NEXT_PUBLIC_APP_NAME=Truck Management System
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Server-side rendering (SSR)
- Automatic code splitting
- Image optimization
- Font optimization
- CSS optimization

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- Color contrast

## Next Steps

1. ✅ Authentication - Done
2. ✅ Dashboard - Done
3. ✅ Vehicles - Done
4. ✅ Activity Logs - Done
5. ⏳ Add Driver pages
6. ⏳ Add Client pages
7. ⏳ Add Trip pages
8. ⏳ Add Expense pages
9. ⏳ Add Invoice pages
10. ⏳ Add Reports with charts

## Troubleshooting

### API Connection Error

```
Error: Network Error
```

**Solution:**
- Check if backend is running on port 5000
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend

### Authentication Issues

```
Error: 401 Unauthorized
```

**Solution:**
- Clear localStorage
- Login again
- Check token expiry
- Verify JWT_SECRET matches backend

### Build Errors

```
Error: Module not found
```

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## License

MIT

