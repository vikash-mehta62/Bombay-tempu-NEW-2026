const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
// app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware - DISABLED: Using multer in individual routes instead
// app.use(fileUpload({
//   useTempFiles: false,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
//   abortOnLimit: true,
//   createParentPath: true
// }));

// Serve static files
app.use('/uploads', express.static('public/uploads'));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/fleet-owners', require('./routes/fleetOwners'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/trip-expenses', require('./routes/tripExpenses'));
app.use('/api/trip-advances', require('./routes/tripAdvances'));
app.use('/api/client-payments', require('./routes/clientPayments'));
app.use('/api/client-expenses', require('./routes/clientExpenses'));
app.use('/api/collection-memos', require('./routes/collectionMemos'));
app.use('/api/balance-memos', require('./routes/balanceMemos'));
app.use('/api/client-pods', require('./routes/clientPODRoutes'));
app.use('/api/adjustment-payments', require('./routes/adjustmentPayments'));
app.use('/api/driver-calculations', require('./routes/driverCalculations'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/reports', require('./routes/reports'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Truck Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      vehicles: '/api/vehicles',
      logs: '/api/logs'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚚 Truck Management System API                     ║
║                                                       ║
║   Server running in ${process.env.NODE_ENV || 'development'} mode                    ║
║   Port: ${PORT}                                        ║
║   URL: http://localhost:${PORT}                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});
