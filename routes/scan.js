const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { getSocket } = require('../whatsapp/client');
const { formatWhatsAppJID, extractPhoneFromJID } = require('../utils/phoneFormatter');
const logger = require('../utils/logger');

/**
 * Route publique pour la redirection QR → WhatsApp
 * Quand un utilisateur scanne un QR code, cette route redirige vers WhatsApp
 * 
 * GET /api/scan/:code
 * - :code = code unique du QR code (pour badge médical ou inscription)
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Appeler directement le contrôleur avec le code
    // On crée une requête mock pour getQRInfo
    const mockReq = {
      params: { code }
    };
    
    let qrInfo = null;
    let responseSent = false;
    
    // Créer un mock response pour capturer la réponse
    const mockRes = {
      json: (data) => {
        qrInfo = data;
      },
      status: (code) => ({
        json: (data) => {
          qrInfo = { success: false, error: data.error || 'Erreur' };
        }
      })
    };
    
    // Appeler getQRInfo
    await qrController.getQRInfo(mockReq, mockRes);
    
    if (!qrInfo || !qrInfo.success) {
      return res.status(404).json({
        success: false,
        error: 'QR code invalide ou expiré'
      });
    }
    
    // Si c'est un QR code badge médical
    if (qrInfo.data && qrInfo.data.medical) {
      // Récupérer le numéro WhatsApp du bot
      const socket = getSocket();
      let botPhoneNumber = null;
      
      if (socket && socket.user && socket.user.id) {
        botPhoneNumber = extractPhoneFromJID(socket.user.id);
      }
      
      if (!botPhoneNumber) {
        botPhoneNumber = process.env.WHATSAPP_BOT_NUMBER || process.env.SUPERVISOR_PHONES?.split(',')[0];
      }
      
      if (botPhoneNumber) {
        // Nettoyer le numéro
        const cleanNumber = botPhoneNumber.replace(/[^0-9]/g, '');
        
        // Créer un lien WhatsApp avec les informations médicales pré-remplies
        const user = qrInfo.data.user || {};
        const medical = qrInfo.data.medical || {};
        const message = `🏥 Informations médicales - ${user.name || 'Ouvrier'}\n\n` +
          `Groupe sanguin: ${medical.bloodType || 'Non renseigné'}\n` +
          `Allergies: ${medical.allergies || 'Aucune'}\n` +
          `Maladies chroniques: ${medical.chronicConditions || 'Aucune'}\n` +
          `Médicaments: ${medical.medications || 'Aucun'}\n` +
          `Contact urgence: ${medical.emergencyContact || 'Non renseigné'}`;
        
        const whatsappLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
        return res.redirect(whatsappLink);
      }
    }
    
    // Par défaut, retourner les informations du QR code
    res.json({
      success: true,
      data: qrInfo.data,
      message: 'Scannez ce QR code avec WhatsApp pour accéder au chatbot'
    });
    
  } catch (error) {
    logger.error('Erreur route scan:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du QR code'
    });
  }
});

/**
 * Route pour obtenir le lien WhatsApp direct du chatbot
 * GET /api/scan/whatsapp/link
 */
router.get('/whatsapp/link', async (req, res) => {
  try {
    const socket = getSocket();
    let botPhoneNumber = null;
    
    // Récupérer le numéro depuis la session active
    if (socket && socket.user && socket.user.id) {
      botPhoneNumber = extractPhoneFromJID(socket.user.id);
    }
    
    // Fallback sur variable d'environnement ou numéro par défaut
    if (!botPhoneNumber) {
      botPhoneNumber = process.env.WHATSAPP_BOT_NUMBER || process.env.SUPERVISOR_PHONES?.split(',')[0] || '43222671';
    }
    
    // Si le numéro est 43222671 (numéro local), le formater en 22943222671
    if (botPhoneNumber === '43222671' || botPhoneNumber === '+43222671') {
      botPhoneNumber = '22943222671';
    }
    
    // Nettoyer le numéro
    let cleanNumber = botPhoneNumber.replace(/[^0-9]/g, '');
    
    // S'assurer que le numéro commence par 229
    if (!cleanNumber.startsWith('229')) {
      if (cleanNumber.length === 8) {
        cleanNumber = '229' + cleanNumber;
      } else if (cleanNumber.length === 9 && cleanNumber.startsWith('0')) {
        cleanNumber = '229' + cleanNumber.substring(1);
      }
    }
    
    // Créer le lien WhatsApp avec "Écrire à SHORA" pré-rempli
    const messageText = encodeURIComponent('Écrire à SHORA');
    const whatsappLink = `https://wa.me/22943222671?text=${messageText}`;
    
    res.json({
      success: true,
      data: {
        whatsappLink,
        botName: 'SHORA BOT',
        message: 'Lien direct vers le chatbot WhatsApp'
      }
    });
    
  } catch (error) {
    logger.error('Erreur génération lien WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du lien'
    });
  }
});

module.exports = router;

