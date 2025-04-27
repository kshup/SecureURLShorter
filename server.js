const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bcrypt = require('bcryptjs'); // Add bcryptjs for default admin hashing
const mongoSanitize = require('express-mongo-sanitize'); // Add mongo-sanitize

// Load environment variables
dotenv.config();

// Set environment variables manually if not available from .env
if (!process.env.PORT) process.env.PORT = 5000;
if (!process.env.MONGO_URI) process.env.MONGO_URI = 'mongodb://localhost:27017/urlshortener';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'your_secret_jwt_key_123456';
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

// Global variable to store URLs in memory when MongoDB is not available
global.inMemoryUrls = [];
global.inMemoryUsers = []; // Initialize empty first
global.mongoConnected = false;

// Log environment variables for debugging
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Check if .env file exists
fs.access('.env', fs.constants.F_OK, (err) => {
  console.log('.env file exists:', !err);
  if (!err) {
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log('.env file content:', envContent);
  }
});

// Initialize express
const app = express();

// Security Middleware
app.use(helmet()); // Add security headers
app.use(cors());   // Enable CORS
app.use(mongoSanitize()); // Sanitize input against NoSQL injection

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter); // Apply rate limiting to all requests

// Body Parser Middleware
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// API Routes
const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');
const adminRoutes = require('./routes/admin');

// Use API routes
app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/admin', adminRoutes);

// Serve Admin Panel HTML
app.get('/admin', (req, res) => {
  // TODO: Add admin authentication/authorization check here
  // For now, serves admin.html to anyone navigating to /admin
  res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

// Handle URL shortener redirects - Placed before the final catch-all
app.get('/r/:shortUrl', async (req, res, next) => {
  try {
    // Basic validation for shortUrl parameter
    if (!req.params.shortUrl || !/^[a-zA-Z0-9_-]+$/.test(req.params.shortUrl)) {
       return next(); // Pass to next route handler (catch-all) if pattern doesn't match typical shortid
    }
    const redirectController = require('./controllers/redirect');
    await redirectController(req, res);
  } catch (err) {
    console.error('Redirect error:', err);
    // Avoid sending response if headers already sent by controller
    if (!res.headersSent) {
        res.status(500).send('Server error during redirect');
    }
  }
});

/* // Temporarily comment out the catch-all route for debugging
// Catch-all for Single Page Application (SPA) - Main Frontend
// This MUST be the LAST route
app.get('*', (req, res) => {
  // Exclude API calls and specific file requests handled by static middleware
  if (req.url.startsWith('/api/') || req.url.includes('.')) { 
     // Let previous routes handle API, let static handle files, or 404
     return res.status(404).send('Resource not found.');
  }
  // Serve the main frontend index.html for SPA routing
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});
*/

// Start server without MongoDB for testing
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

// Connect to MongoDB (will be attempted but not block server startup)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    global.mongoConnected = true;
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Server running without MongoDB connection');
    console.log('Using in-memory storage instead');
  });

// Function to add default admin user (hashed password)
async function addDefaultAdminUser() {
  try {
    const adminEmail = 'admin@example.com'; // Or just 'admin' if preferred
    const adminPassword = 'admin';
    const existingAdmin = global.inMemoryUsers.find(u => u.email === adminEmail);

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      const adminUser = {
        id: 'admin_user_01', // Static ID for default admin
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true, // Add an isAdmin flag
        createdAt: new Date()
      };
      global.inMemoryUsers.push(adminUser);
      console.log('Default admin user added to in-memory store.');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
}

// Add the default admin user when the server starts
addDefaultAdminUser(); 