const BlacklistIp = require('../models/BlacklistIp');

// Get all blacklisted IPs
exports.getAllBlacklistedIps = async (req, res) => {
  try {
    const blacklistedIps = await BlacklistIp.find().sort({ createdAt: -1 });
    res.json(blacklistedIps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add an IP to blacklist
exports.addToBlacklist = async (req, res) => {
  const { ip, reason } = req.body;
  
  if (!ip) {
    return res.status(400).json({ error: 'IP address is required' });
  }
  
  try {
    // Check if IP is already blacklisted
    let blacklistedIp = await BlacklistIp.findOne({ ip });
    
    if (blacklistedIp) {
      return res.status(400).json({ error: 'IP is already blacklisted' });
    }
    
    // Create new blacklisted IP
    blacklistedIp = new BlacklistIp({
      ip,
      reason
    });
    
    await blacklistedIp.save();
    
    res.json(blacklistedIp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove an IP from blacklist
exports.removeFromBlacklist = async (req, res) => {
  try {
    const blacklistedIp = await BlacklistIp.findById(req.params.id);
    
    if (!blacklistedIp) {
      return res.status(404).json({ error: 'Blacklisted IP not found' });
    }
    
    await blacklistedIp.remove();
    
    res.json({ msg: 'IP removed from blacklist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}; 