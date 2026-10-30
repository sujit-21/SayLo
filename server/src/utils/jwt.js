const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'saylo_secret_fallback_key', {
    expiresIn: '30d',
  });
};

module.exports = { generateToken };

