const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { sendMessage, sendAudio } = require('../whatsapp/sender');
const { isConnected } = require('../whatsapp/client');
const logger = require('../utils/logger');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * POST /api/whatsapp/test
 * Envoyer un message de test
 */
router.post('/test', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numéro de téléphone requis' 
      });
    }
    
    if (!isConnected()) {
      return res.status(503).json({ 
        success: false, 
        error: 'WhatsApp n\'est pas connecté' 
      });
    }
    
    const testMessage = message || `🧪 Message de test depuis Shora-Bot\n\nDate: ${new Date().toLocaleString('fr-FR')}`;
    
    const result = await sendMessage(phoneNumber, testMessage);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Message de test envoyé avec succès',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Erreur lors de l\'envoi du message'
      });
    }
  } catch (error) {
    logger.error('Erreur test WhatsApp:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

