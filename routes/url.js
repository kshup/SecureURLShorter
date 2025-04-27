const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const Url = require('../models/Url');
const { generateQR } = require('../controllers/qrcode');

// @route   POST api/url/shorten
// @desc    Create a short URL
// @access  Public/Private (works for both)
router.post('/shorten', async (req, res) => {
  const { originalUrl, expirationDate, allowedIps } = req.body;
  
  try {
    // Get client IP
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Create short URL code
    const shortUrl = shortid.generate();
    
    // Process allowed IPs, ensure creator's IP is always included
    let finalAllowedIps = [];
    
    // Add user-specified IPs if any
    if (allowedIps && Array.isArray(allowedIps) && allowedIps.length > 0) {
      finalAllowedIps = [...allowedIps];
    }
    
    // Add creator's IP if not already in the list
    if (!finalAllowedIps.includes(clientIp)) {
      finalAllowedIps.push(clientIp);
    }
    
    // Create URL object
    const urlData = {
      _id: shortid.generate(),
      originalUrl,
      shortUrl,
      expirationDate,
      allowedIps: finalAllowedIps.length > 0 ? finalAllowedIps : null,
      clicks: 0,
      createdAt: new Date()
    };
    
    // If user is authenticated, associate URL with user
    if (req.header('x-auth-token')) {
      try {
        const decoded = jwt.verify(req.header('x-auth-token'), process.env.JWT_SECRET);
        urlData.owner = decoded.user.id;
      } catch (err) {
        // Token invalid, continue as anonymous
      }
    }
    
    // Try to save to MongoDB if connected, otherwise use in-memory storage
    if (global.mongoConnected) {
      // Create Mongoose model and save
      const url = new Url(urlData);
      await url.save();
      res.json(url);
    } else {
      // Use in-memory storage
      global.inMemoryUrls.push(urlData);
      res.json(urlData);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/url/all
// @desc    Get all URLs for a user
// @access  Private
router.get('/all', auth, async (req, res) => {
  try {
    if (global.mongoConnected) {
      const urls = await Url.find({ owner: req.user.id }).sort({ createdAt: -1 });
      res.json(urls);
    } else {
      // Use in-memory storage
      const urls = global.inMemoryUrls.filter(url => url.owner === req.user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(urls);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/url/:shortUrl
// @desc    Get original URL by short URL code (info only, not redirection)
// @access  Public
router.get('/:shortUrl', async (req, res) => {
  try {
    let url;
    
    if (global.mongoConnected) {
      url = await Url.findOne({ shortUrl: req.params.shortUrl });
    } else {
      // Use in-memory storage
      url = global.inMemoryUrls.find(u => u.shortUrl === req.params.shortUrl);
    }
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    res.json(url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE api/url/:id
// @desc    Delete a URL
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let url;
    
    if (global.mongoConnected) {
      url = await Url.findById(req.params.id);
      
      if (!url) {
        return res.status(404).json({ error: 'URL not found' });
      }
      
      // Check if URL belongs to user
      if (url.owner && url.owner.toString() !== req.user.id) {
        return res.status(401).json({ error: 'Not authorized' });
      }
      
      await url.remove();
    } else {
      // Use in-memory storage
      const index = global.inMemoryUrls.findIndex(u => u._id === req.params.id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'URL not found' });
      }
      
      const url = global.inMemoryUrls[index];
      
      // Check if URL belongs to user
      if (url.owner && url.owner !== req.user.id) {
        return res.status(401).json({ error: 'Not authorized' });
      }
      
      global.inMemoryUrls.splice(index, 1);
    }
    
    res.json({ msg: 'URL removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/url/qrcode/:shortUrl
// @desc    Generate QR code for a short URL
// @access  Public
router.get('/qrcode/:shortUrl', generateQR);

module.exports = router; 