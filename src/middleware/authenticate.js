const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwtConfig');
const { isTokenBlacklisted } = require('./blacklistToken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Unauthorized',
      data: {}
    });
  }

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token has been revoked',
      data: {}
    });
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden',
        data: {}
      });
    }
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
