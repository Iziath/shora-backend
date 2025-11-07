const logger = require('../utils/logger');

/**
 * Middleware de gestion d'erreurs global
 */
module.exports = (err, req, res, next) => {
  logger.error('Erreur:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Erreur de validation',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Erreur de duplication (unique)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Cette ressource existe déjà'
    });
  }
  
  // Erreur par défaut
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erreur serveur interne'
  });
};

