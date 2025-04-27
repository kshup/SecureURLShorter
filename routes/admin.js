const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// Import admin specific controllers
const {
  getOverallStats,
  getAllUrlsAdmin,
  getAllUsersAdmin,
  getAllClickStatsAdmin,
} = require('../controllers/admin'); 
const {
  getAllBlacklistedIps,
  addToBlacklist,
  removeFromBlacklist
} = require('../controllers/blacklist');

// --- Admin Panel Routes ---
// Assumes 'auth' middleware checks for login, but not specific admin role yet.

// @route   GET api/admin/overall-stats
// @desc    Get overall counts for dashboard overview
// @access  Private (Admin)
router.get('/overall-stats', auth, getOverallStats);

// @route   GET api/admin/all-urls
// @desc    Get all URLs for admin management
// @access  Private (Admin)
router.get('/all-urls', auth, getAllUrlsAdmin);

// @route   GET api/admin/users
// @desc    Get all users for admin management
// @access  Private (Admin)
router.get('/users', auth, getAllUsersAdmin);

// @route   GET api/admin/all-click-stats
// @desc    Get all click stats for admin logs
// @access  Private (Admin)
router.get('/all-click-stats', auth, getAllClickStatsAdmin);

// @route   GET api/admin/blacklist
// @desc    Get all blacklisted IPs
// @access  Private (Admin)
router.get('/blacklist', auth, getAllBlacklistedIps);

// @route   POST api/admin/blacklist
// @desc    Add an IP to blacklist
// @access  Private (Admin)
router.post('/blacklist', auth, addToBlacklist);

// @route   DELETE api/admin/blacklist/:id
// @desc    Remove an IP from blacklist
// @access  Private (Admin)
router.delete('/blacklist/:id', auth, removeFromBlacklist);


// --- User Specific Routes (Kept for potential user dashboard) ---
const { getUrlStats, getUrlDetails } = require('../controllers/admin'); // Keep user-specific ones

// @route   GET api/admin/stats
// @desc    Get statistics for URLs owned by the LOGGED IN user
// @access  Private
router.get('/stats', auth, getUrlStats);

// @route   GET api/admin/stats/:urlId
// @desc    Get detailed statistics for a specific URL owned by the LOGGED IN user
// @access  Private
router.get('/stats/:urlId', auth, getUrlDetails);

module.exports = router; 