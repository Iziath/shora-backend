const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification JWT
 */
exports.authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token d\'authentification manquant' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Token invalide:', error.message);
    res.status(401).json({ 
      success: false, 
      error: 'Token invalide ou expiré' 
    });
  }
};

