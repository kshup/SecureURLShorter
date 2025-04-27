const Url = require('../models/Url');
const Stats = require('../models/Stats');
const BlacklistIp = require('../models/BlacklistIp');

module.exports = async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Check if IP is blacklisted (only if MongoDB is connected)
    if (global.mongoConnected) {
      const blacklistedIp = await BlacklistIp.findOne({ ip: clientIp });
      
      if (blacklistedIp) {
        return res.status(403).send('Your IP address has been blacklisted');
      }
    }
    
    // Find the URL
    let url;
    
    if (global.mongoConnected) {
      url = await Url.findOne({ shortUrl: req.params.shortUrl });
    } else {
      // Use in-memory storage
      url = global.inMemoryUrls.find(u => u.shortUrl === req.params.shortUrl);
    }
    
    if (!url) {
      return res.status(404).send('URL not found');
    }
    
    // Check if URL has expired
    if (url.expirationDate && new Date(url.expirationDate) < new Date()) {
      return res.status(410).send('Link has expired');
    }
    
    // Check IP restrictions if enabled
    if (url.allowedIps && url.allowedIps.length > 0) {
      if (!url.allowedIps.includes(clientIp)) {
        return res.status(403).send('Access denied from your IP address');
      }
    }
    
    // Record statistics if MongoDB is connected
    if (global.mongoConnected) {
      try {
        const stats = new Stats({
          urlId: url._id,
          ip: clientIp,
          userAgent: req.headers['user-agent'],
          referrer: req.headers.referer || req.headers.referrer
        });
        
        // Save stats asynchronously - don't wait for it to complete
        stats.save().catch(err => console.error('Failed to save stats:', err));
      } catch (err) {
        console.error('Error recording stats:', err);
        // Continue with redirect even if stats recording fails
      }
    }
    
    // Increment click counter
    url.clicks++;
    
    // Update the URL in the appropriate storage
    if (global.mongoConnected) {
      await url.save();
    } else {
      // For in-memory storage, the object is already updated
      // No need to do anything as it's passed by reference
    }
    
    // Redirect to original URL
    return res.redirect(url.originalUrl);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send('Server error');
  }
}; 