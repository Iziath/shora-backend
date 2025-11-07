const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticate } = require('../middleware/authMiddleware');

// Route publique pour lire le QR
router.get('/:code', qrController.getQRInfo);

// Route publique pour générer le QR code WhatsApp d'inscription
router.get('/whatsapp/generate', qrController.generateWhatsAppQR);

// Route publique pour générer le QR code du chatbot (dashboard)
router.get('/chatbot/generate', qrController.generateChatbotQR);

// Route protégée pour récupérer les statistiques WhatsApp
router.get('/whatsapp/stats', authenticate, qrController.getWhatsAppStats);

// Routes protégées pour générer/mettre à jour
router.post('/generate', authenticate, qrController.generateQR);
router.put('/:userId', authenticate, qrController.updateMedicalInfo);

module.exports = router;

