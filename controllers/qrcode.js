const QRCode = require('qrcode');
const Url = require('../models/Url');

// Generate QR code for a shortened URL
exports.generateQR = async (req, res) => {
  try {
    // Find the URL
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
    
    // Generate the full URL including the domain
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullShortUrl = `${baseUrl}/r/${url.shortUrl}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(fullShortUrl);
    
    res.json({ qrCode: qrCodeDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}; 