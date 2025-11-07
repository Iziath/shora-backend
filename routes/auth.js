const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Admin simple (pour MVP - à améliorer avec un modèle Admin)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@shora.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 
  bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

/**
 * POST /api/auth/login
 * Connexion admin
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email et mot de passe requis' 
      });
    }
    
    // Vérifier les credentials
    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ 
        success: false, 
        error: 'Identifiants invalides' 
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Identifiants invalides' 
      });
    }
    
    // Générer le token JWT
    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: { email, role: 'admin' }
      }
    });
  } catch (error) {
    logger.error('Erreur login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Déconnexion (côté client - invalider le token)
 */
router.post('/logout', (req, res) => {
  // Pour une vraie déconnexion, on pourrait utiliser une blacklist de tokens
  // Pour l'instant, c'est géré côté client
  res.json({ success: true, message: 'Déconnexion réussie' });
});

/**
 * GET /api/auth/verify
 * Vérifier le token JWT
 */
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token manquant' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    res.json({
      success: true,
      data: { user: decoded }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token invalide' });
  }
});

module.exports = router;

