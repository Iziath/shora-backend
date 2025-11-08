const MedicalProfile = require('../models/MedicalProfile');
const User = require('../models/User');
const Interaction = require('../models/Interaction');
const { generateQRCode } = require('../utils/qrGenerator');
const { isConnected, getSocket, getConnectedAt } = require('../whatsapp/client');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Génère un badge QR médical pour un utilisateur
 */
exports.generateQR = async (req, res) => {
  try {
    const { userId, medicalData } = req.body;
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    // Générer un code QR unique
    const qrCode = crypto.randomBytes(16).toString('hex');
    
    // Créer ou mettre à jour le profil médical
    let medicalProfile = await MedicalProfile.findOne({ userId });
    
    if (medicalProfile) {
      // Mettre à jour
      Object.assign(medicalProfile, medicalData, { qrCode });
      await medicalProfile.save();
    } else {
      // Créer
      medicalProfile = new MedicalProfile({
        userId,
        ...medicalData,
        qrCode
      });
      await medicalProfile.save();
    }
    
    // Générer l'image QR
    const qrImageUrl = await generateQRCode(qrCode);
    
    res.json({
      success: true,
      data: {
        qrCode,
        qrImageUrl,
        medicalProfile
      }
    });
  } catch (error) {
    logger.error('Erreur generateQR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupère les informations médicales via le code QR
 */
exports.getQRInfo = async (req, res) => {
  try {
    const { code } = req.params;
    
    const medicalProfile = await MedicalProfile.findOne({ qrCode: code })
      .populate('userId', 'name phoneNumber profession');
    
    if (!medicalProfile) {
      return res.status(404).json({ success: false, error: 'Code QR invalide' });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          name: medicalProfile.userId.name,
          phoneNumber: medicalProfile.userId.phoneNumber,
          profession: medicalProfile.userId.profession
        },
        medical: {
          bloodType: medicalProfile.bloodType,
          allergies: medicalProfile.allergies,
          chronicConditions: medicalProfile.chronicConditions,
          medications: medicalProfile.medications,
          emergencyContact: medicalProfile.emergencyContact
        }
      }
    });
  } catch (error) {
    logger.error('Erreur getQRInfo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Met à jour les informations médicales d'un utilisateur
 */
exports.updateMedicalInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const medicalData = req.body;
    
    let medicalProfile = await MedicalProfile.findOne({ userId });
    
    if (!medicalProfile) {
      return res.status(404).json({ success: false, error: 'Profil médical non trouvé' });
    }
    
    Object.assign(medicalProfile, medicalData);
    await medicalProfile.save();
    
    res.json({ success: true, data: medicalProfile });
  } catch (error) {
    logger.error('Erreur updateMedicalInfo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Génère un QR code dynamique pour l'inscription WhatsApp
 * Le QR code contient un lien WhatsApp qui ouvre directement une conversation avec le chatbot
 * Le numéro n'est pas affiché - c'est un chatbot direct
 */
exports.generateWhatsAppQR = async (req, res) => {
  try {
    // TOUJOURS utiliser le numéro 43222671 pour le QR code
    // Ce numéro est le numéro officiel du chatbot SHORA
    let botPhoneNumber = process.env.WHATSAPP_BOT_NUMBER || '43222671';
    
    // Si le numéro est 43222671 (numéro local), le formater en 22943222671
    if (botPhoneNumber === '43222671' || botPhoneNumber === '+43222671') {
      botPhoneNumber = '22943222671';
    }
    
    // Nettoyer le numéro (enlever + et espaces)
    let cleanNumber = botPhoneNumber.replace(/[^0-9]/g, '');
    
    // S'assurer que le numéro commence par 229
    if (!cleanNumber.startsWith('229')) {
      if (cleanNumber.length === 8) {
        // Numéro local (8 chiffres) -> ajouter 229
        cleanNumber = '229' + cleanNumber;
      } else if (cleanNumber.length === 9 && cleanNumber.startsWith('0')) {
        // Numéro avec 0 -> remplacer par 229
        cleanNumber = '229' + cleanNumber.substring(1);
      } else if (cleanNumber.length === 11 && cleanNumber.startsWith('229')) {
        // Déjà au bon format
        // Ne rien faire
      } else {
        // Par défaut, utiliser 22943222671
        cleanNumber = '22943222671';
      }
    }
    
    // Vérification finale : s'assurer qu'on utilise bien 22943222671
    if (cleanNumber !== '22943222671') {
      logger.warn(`Numéro QR code différent de 22943222671, utilisation de: ${cleanNumber}`);
      // Forcer l'utilisation de 22943222671
      cleanNumber = '22943222671';
    }
    
    // Créer le lien WhatsApp (wa.me) qui ouvre directement le chat avec "Écrire à SHORA" pré-rempli
    // Format: https://wa.me/22943222671?text=Écrire à SHORA
    // Ce lien ouvre WhatsApp et démarre directement une conversation avec le bot
    // TOUJOURS utiliser 22943222671 (numéro du chatbot SHORA)
    const messageText = encodeURIComponent('Écrire à SHORA');
    const whatsappLink = `https://wa.me/22943222671?text=${messageText}`;
    
    logger.info(`✅ QR code généré avec le numéro: 22943222671 (43222671)`);
    
    // Générer le QR code avec le lien
    const qrImageUrl = await generateQRCode(whatsappLink);
    
    res.json({
      success: true,
      data: {
        qrCode: whatsappLink,
        qrImageUrl,
        whatsappLink,
        // Ne pas retourner le numéro - c'est un chatbot direct
        botPhoneNumber: null // Complètement masqué - expérience chatbot pure
      }
    });
  } catch (error) {
    logger.error('Erreur generateWhatsAppQR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Génère un QR code pour ouvrir directement le chatbot dans le dashboard
 * Le QR code contient un lien vers le dashboard avec le paramètre ?chat=open
 */
/**
 * Récupère l'IP locale de la machine
 */
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorer les adresses IPv6 et les interfaces non IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

exports.generateChatbotQR = async (req, res) => {
  try {
    // URL du frontend (page publique du chatbot)
    // En production: TOUJOURS utiliser la variable d'environnement
    // En développement local: utiliser l'IP locale pour permettre l'accès depuis mobile
    let frontendUrl = process.env.FRONTEND_URL || process.env.DASHBOARD_URL;
    
    // En production, FORCER l'utilisation de FRONTEND_URL
    if (process.env.NODE_ENV === 'production') {
      if (!frontendUrl) {
        logger.error('❌ FRONTEND_URL non défini en production ! Veuillez configurer cette variable.');
        return res.status(500).json({
          success: false,
          error: 'FRONTEND_URL non configuré. Veuillez définir FRONTEND_URL dans les variables d\'environnement.'
        });
      }
      // S'assurer que l'URL commence par https:// en production
      if (!frontendUrl.startsWith('https://')) {
        logger.warn(`⚠️ FRONTEND_URL ne commence pas par https://: ${frontendUrl}`);
        // Ne pas forcer https:// automatiquement, mais logger un avertissement
      }
    } else {
      // En développement, utiliser l'IP locale si FRONTEND_URL n'est pas défini
      if (!frontendUrl) {
        const localIP = getLocalIP();
        const frontendPort = process.env.FRONTEND_PORT || '5173';
        frontendUrl = `http://${localIP}:${frontendPort}`;
        logger.info(`🔧 Mode développement: utilisation de l'IP locale ${frontendUrl}`);
      }
    }
    
    // Nettoyer l'URL (enlever le slash final si présent)
    frontendUrl = frontendUrl.replace(/\/$/, '');
    
    // Créer le lien vers la page publique du chatbot (accessible sur mobile)
    const chatbotLink = `${frontendUrl}/chatbot`;
    
    logger.info(`✅ QR code chatbot généré: ${chatbotLink}`);
    logger.info(`📱 Environnement: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 Frontend URL: ${frontendUrl}`);
    
    // Générer le QR code avec le lien
    const qrImageUrl = await generateQRCode(chatbotLink);
    
    res.json({
      success: true,
      data: {
        qrCode: chatbotLink,
        qrImageUrl,
        chatbotLink,
        message: 'Scannez ce QR code avec votre téléphone pour ouvrir directement le chatbot SHORA'
      }
    });
  } catch (error) {
    logger.error('Erreur generateChatbotQR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupère les statistiques et l'état de connexion WhatsApp
 */
exports.getWhatsAppStats = async (req, res) => {
  try {
    // État de connexion
    const connected = isConnected();
    const socket = getSocket();
    
    // Récupérer le numéro WhatsApp du bot depuis la session active
    let botPhoneNumber = null;
    
    // Essayer de récupérer le numéro depuis la session WhatsApp active
    if (socket && socket.user && socket.user.id) {
      const jid = socket.user.id;
      const numberMatch = jid.match(/^(\d+)@/);
      if (numberMatch) {
        botPhoneNumber = numberMatch[1];
      }
    }
    
    // Si pas de session active, utiliser la variable d'environnement ou le numéro par défaut
    if (!botPhoneNumber) {
      botPhoneNumber = process.env.WHATSAPP_BOT_NUMBER || process.env.SUPERVISOR_PHONES?.split(',')[0] || '43222671';
    }
    
    // Si le numéro est 43222671 (numéro local), le formater en 22943222671
    if (botPhoneNumber === '43222671' || botPhoneNumber === '+43222671') {
      botPhoneNumber = '22943222671';
    }
    
    // Ne pas afficher le numéro - c'est un chatbot, afficher "SHORA BOT"
    const formattedNumber = connected ? 'SHORA BOT' : 'Non connecté';
    
    // Calculer la durée de connexion (si connecté)
    let connectedSinceText = null;
    if (connected) {
      const connectedAt = getConnectedAt();
      if (connectedAt) {
        const now = new Date();
        const diffMs = now.getTime() - connectedAt.getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffHours < 1) {
          const diffMins = Math.floor(diffMs / 60000);
          connectedSinceText = `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
          connectedSinceText = `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
        } else {
          connectedSinceText = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        }
      } else {
        connectedSinceText = "Aujourd'hui";
      }
    }
    
    // Statistiques depuis la base de données
    // Messages envoyés = toutes les interactions où le bot a envoyé un message
    // (alert, tip, quiz sont des messages envoyés par le bot)
    const messagesSent = await Interaction.countDocuments({
      messageType: { $in: ['alert', 'tip', 'quiz'] }
    });
    
    // Messages reçus = toutes les interactions où l'utilisateur a répondu
    // (response, incident, other sont des messages reçus de l'utilisateur)
    const messagesReceived = await Interaction.countDocuments({
      messageType: { $in: ['response', 'incident', 'other'] }
    });
    
    // Total des messages = somme des messages envoyés et reçus
    const totalMessages = messagesSent + messagesReceived;
    
    // Conversations actives (utilisateurs ayant interagi dans les 7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeConversations = await User.countDocuments({
      isActive: true,
      lastInteraction: { $gte: sevenDaysAgo }
    });
    
    // Taux de réponse = pourcentage de messages reçus par rapport au total
    // Plus le taux est élevé, plus les utilisateurs répondent
    const responseRate = totalMessages > 0 
      ? Math.round((messagesReceived / totalMessages) * 100)
      : 0;
    
    // Dernière activité (dernière interaction)
    const lastInteraction = await Interaction.findOne()
      .sort({ timestamp: -1 })
      .select('timestamp');
    
    let lastActivityText = 'Aucune activité';
    if (lastInteraction && lastInteraction.timestamp) {
      const now = new Date();
      const diffMs = now - lastInteraction.timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) {
        lastActivityText = 'À l\'instant';
      } else if (diffMins < 60) {
        lastActivityText = `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        lastActivityText = `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else {
        lastActivityText = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }
    }
    
    res.json({
      success: true,
      data: {
        connection: {
          connected,
          botPhoneNumber: formattedNumber, // Affiche "SHORA BOT" au lieu du numéro
          connectedSince: connectedSinceText,
          lastActivity: lastActivityText
        },
        statistics: {
          messagesSent,
          messagesReceived,
          totalMessages,
          activeConversations,
          responseRate
        }
      }
    });
  } catch (error) {
    logger.error('Erreur getWhatsAppStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

