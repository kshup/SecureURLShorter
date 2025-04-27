const Url = require('../../models/Url');
const rateLimit = require('express-rate-limit');
const auth = require('../../middleware/auth');
const { checkSafeBrowsing } = require('../../utils/security');
const { validateIp } = require('../../utils/validation');

// Shorten URL
router.post('/shorten', auth, limiter, async (req, res) => {
  const { originalUrl, expirationDate, allowedIps, password } = req.body;
  const userId = req.user.id;

  // 1. Stricter URL Validation
  try {
    const parsedUrl = new URL(originalUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ msg: 'Invalid URL protocol. Only HTTP and HTTPS are allowed.' });
    }
  } catch (err) {
    return res.status(400).json({ msg: 'Invalid URL format.' });
  }

  // 2. Safe Browsing Check
  const isSafe = await checkSafeBrowsing(originalUrl);
  if (!isSafe) {
    return res.status(400).json({ msg: 'URL is flagged as unsafe.' });
  }

  // 3. Validate Allowed IPs format (if provided)
  if (allowedIps && allowedIps.length > 0) {
    for (const ip of allowedIps) {
      if (!validateIp(ip)) {
        return res.status(400).json({ msg: `Invalid IP address format: ${ip}` });
      }
    }
  }

  // ... (rest of the existing logic: check DB, create short URL, etc.)
  // ... existing code ...
}); 