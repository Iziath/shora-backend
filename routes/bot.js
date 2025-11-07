// backend/routes/bot.js
/**
 * Routes pour le chatbot SHORA
 * Gère les interactions avec le chatbot IA intégré au dashboard
 */

const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');
const { authenticate } = require('../middleware/authMiddleware');

// Route pour le chat (nécessite authentification)
router.post('/chat', authenticate, botController.chat);

// Route pour obtenir l'audio (optionnel)
router.get('/audio/:filename', botController.getAudio);

module.exports = router;

