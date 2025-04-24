const crypto = require('crypto');

function validateInitData(initData) {
  try {
    // Parse the initData string
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const params = Array.from(urlParams.entries())
      .filter(([key]) => key !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create a secret key for HMAC
    const secret = crypto.createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN)
      .digest();

    // Calculate checksum
    const checksum = crypto.createHmac('sha256', secret)
      .update(params)
      .digest('hex');

    // Verify the hash
    if (checksum === hash) {
      // Parse and return user data
      const user = JSON.parse(urlParams.get('user'));
      return user;
    }

    return null;
  } catch (error) {
    console.error('Error validating initData:', error);
    return null;
  }
}

module.exports = { validateInitData }; 