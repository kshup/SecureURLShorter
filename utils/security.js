const axios = require('axios');

const SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
const SAFE_BROWSING_API_URL = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_API_KEY}`;

/**
 * Checks a URL against the Google Safe Browsing API.
 * @param {string} urlToCheck The URL to check.
 * @returns {Promise<boolean>} True if the URL is safe, false otherwise.
 */
async function checkSafeBrowsing(urlToCheck) {
  if (!SAFE_BROWSING_API_KEY) {
    console.warn('Google Safe Browsing API key not configured. Skipping check.');
    return true; // Fail open (assume safe) if key is missing
  }
  if (!urlToCheck || typeof urlToCheck !== 'string') {
      return true; // Cannot check invalid URL, assume safe for now
  }

  try {
    const requestBody = {
      client: {
        clientId: 'url-shortener-app', // Replace with your app name
        clientVersion: '1.0.0'
      },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [
          { url: urlToCheck }
        ]
      }
    };

    const response = await axios.post(SAFE_BROWSING_API_URL, requestBody);

    // If the response body has a 'matches' array, it means the URL is unsafe.
    if (response.data && response.data.matches && response.data.matches.length > 0) {
      console.warn(`Unsafe URL detected by Safe Browsing: ${urlToCheck}`);
      return false; // Unsafe
    }

    return true; // Safe

  } catch (error) {
    console.error('Error calling Google Safe Browsing API:', error.response?.data || error.message);
    // In case of API error, fail open (assume safe) to avoid blocking legitimate URLs
    // You might want stricter behavior in production.
    return true; 
  }
}

module.exports = { checkSafeBrowsing }; 