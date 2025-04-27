const Url = require('../models/Url');
const Stats = require('../models/Stats');
const User = require('../models/User');

// Note: In-memory operations for admin panel are limited.
// Most features assume MongoDB connection.

// Helper to get all data (handles in-memory vs DB)
async function getAllUrlsWithOwners() {
  if (global.mongoConnected) {
    // Populate owner details when fetching from DB
    return await Url.find().populate('owner', 'email').sort({ createdAt: -1 });
  } else {
    // In-memory: map owner ID to email (requires users in memory too)
    return global.inMemoryUrls.map(url => ({
      ...url,
      owner: global.inMemoryUsers.find(u => u.id === url.owner)
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

async function getAllUsers() {
  if (global.mongoConnected) {
    // TODO: Add URL count aggregation if needed
    return await User.find().select('-password').sort({ createdAt: -1 });
  } else {
    // Return in-memory users without password
    return global.inMemoryUsers.map(u => {
      const { password, ...userWithoutPassword } = u;
      // TODO: Add URL count from inMemoryUrls
      userWithoutPassword.urlCount = global.inMemoryUrls.filter(url => url.owner === u.id).length;
      return userWithoutPassword;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

// Get overall statistics (counts)
exports.getOverallStats = async (req, res) => {
  try {
    let urlCount = 0;
    let userCount = 0;
    let clickCount = 0;

    if (global.mongoConnected) {
      urlCount = await Url.countDocuments();
      userCount = await User.countDocuments();
      clickCount = await Stats.countDocuments();
    } else {
      urlCount = global.inMemoryUrls.length;
      userCount = global.inMemoryUsers.length;
      // clickCount remains 0 for in-memory
    }
    res.json({ urls: urlCount, users: userCount, clicks: clickCount });

  } catch (err) {
     console.error('Error getting overall stats:', err);
     res.status(500).json({ error: 'Server error' });
  }
};

// Get ALL URLs with basic stats
exports.getAllUrlsAdmin = async (req, res) => {
  try {
    const urls = await getAllUrlsWithOwners();
    console.log('[Admin Controller] Fetched URLs for admin panel:', JSON.stringify(urls, null, 2)); // Log the fetched data
    res.json({ urls });
  } catch (err) {
    console.error('Error getting all URLs for admin:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get ALL Users
exports.getAllUsersAdmin = async (req, res) => {
  try {
     const users = await getAllUsers();
     res.json({ users });
  } catch (err) {
     console.error('Error getting all users for admin:', err);
     res.status(500).json({ error: 'Server error' });
  }
};

// Get ALL Click Stats (Requires MongoDB)
exports.getAllClickStatsAdmin = async (req, res) => {
  if (!global.mongoConnected) {
    return res.json({ stats: [] }); // Return empty if no DB
  }
  try {
    // TODO: Add pagination for large datasets
    const stats = await Stats.find()
                             .populate({ path: 'urlId', select: 'shortUrl' }) // Populate shortUrl
                             .sort({ timestamp: -1 })
                             .limit(500); // Limit results for performance
                             
    // Reformat stats to include shortUrl directly if needed by frontend
    const formattedStats = stats.map(stat => ({
      _id: stat._id,
      timestamp: stat.timestamp,
      ip: stat.ip,
      userAgent: stat.userAgent,
      referrer: stat.referrer,
      urlId: stat.urlId?._id, // Keep urlId
      shortUrl: stat.urlId?.shortUrl || 'N/A' // Add shortUrl directly
    }));
    
    res.json({ stats: formattedStats });
  } catch (err) {
     console.error('Error getting all click stats for admin:', err);
     res.status(500).json({ error: 'Server error' });
  }
};


// -------- Original User-Specific Functions (kept for reference/potential use) --------

// Get statistics for URLs owned by the CURRENT user
exports.getUrlStats = async (req, res) => {
  try {
    let userUrls = [];
    if (global.mongoConnected) {
      userUrls = await Url.find({ owner: req.user.id });
    } else {
      userUrls = global.inMemoryUrls.filter(u => u.owner === req.user.id);
       return res.json({ urls: userUrls.map(u => ({ ...u, clicksData: { total: u.clicks } })) });
    }
    
    if (!userUrls || userUrls.length === 0) {
      return res.json({ urls: [] });
    }
    
    // Get statistics for each URL (Only works with MongoDB)
    const urlsWithStats = await Promise.all(
      userUrls.map(async (url) => {
        const stats = await Stats.find({ urlId: url._id });
        const uniqueIps = [...new Set(stats.map(stat => stat.ip))];
        const clicksByDate = {};
        stats.forEach(stat => {
          const date = stat.timestamp.toISOString().split('T')[0];
          clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        });
        
        return {
          _id: url._id,
          originalUrl: url.originalUrl,
          shortUrl: url.shortUrl,
          clicks: url.clicks,
          createdAt: url.createdAt,
          expirationDate: url.expirationDate,
          clicksData: {
            total: url.clicks,
            uniqueIps: uniqueIps.length,
            byDate: Object.entries(clicksByDate).map(([date, count]) => ({ date, count }))
          }
        };
      })
    );
    
    res.json({ urls: urlsWithStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get detailed statistics for a specific URL owned by the CURRENT user
exports.getUrlDetails = async (req, res) => {
  if (!global.mongoConnected) {
    return res.status(503).json({ error: 'Detailed statistics require a database connection.' });
  }

  try {
    const urlId = req.params.urlId;
    const url = await Url.findOne({ _id: urlId, owner: req.user.id });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found or you do not own this URL' });
    }
    
    const detailedStats = await Stats.find({ urlId: urlId }).sort({ timestamp: -1 });
    
    res.json({
      url: url,
      stats: detailedStats 
    });
    
  } catch (err) {
    console.error('Error getting URL details:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid URL ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
}; 