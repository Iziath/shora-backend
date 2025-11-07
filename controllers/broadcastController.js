const User = require('../models/User');
const Broadcast = require('../models/Broadcast');
const { sendMessage, sendAudio } = require('../whatsapp/sender');
const { convertTextToAudio } = require('../services/audioService');
const logger = require('../utils/logger');

/**
 * Envoie un message collectif (immédiat ou programmé)
 */
exports.sendBroadcast = async (req, res) => {
  try {
    const { 
      message, 
      subject,
      language, // Langue du message (fr, fon, yoruba)
      targetProfessions, 
      targetLanguage, 
      sendAsAudio,
      scheduledSlot, // '7h', '12h-14h', '18h', ou null pour immédiat
      scheduledTime // Date spécifique (optionnel)
    } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message requis' });
    }
    
    // Construire le filtre pour compter les destinataires
    // Seuls les utilisateurs ayant scanné le QR et confirmé leur présence peuvent recevoir des messages
    const filter = { 
      isActive: true, 
      conversationState: 'active',
      hasScannedQR: true // Seuls les utilisateurs ayant confirmé leur présence
    };
    
    if (targetProfessions && targetProfessions.length > 0) {
      filter.profession = { $in: targetProfessions };
    }
    
    if (targetLanguage) {
      filter.language = targetLanguage;
    }
    
    // Récupérer les utilisateurs cibles
    const users = await User.find(filter);
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Aucun utilisateur trouvé avec ces critères' 
      });
    }
    
    // Calculer l'heure d'envoi programmée
    let calculatedScheduledTime = null;
    if (scheduledSlot) {
      calculatedScheduledTime = calculateScheduledTime(scheduledSlot);
    } else if (scheduledTime) {
      calculatedScheduledTime = new Date(scheduledTime);
    }
    
    // Créer l'enregistrement de broadcast
    const broadcast = new Broadcast({
      message,
      subject: subject || '',
      language: language || targetLanguage || 'fr', // Langue du message
      targetProfessions: targetProfessions || [],
      targetLanguage, // Langue cible des utilisateurs
      sendAsAudio: sendAsAudio || false,
      scheduledTime: calculatedScheduledTime,
      scheduledSlot: scheduledSlot || null,
      status: calculatedScheduledTime ? 'pending' : 'sending',
      totalRecipients: users.length,
      createdBy: req.user?.email || 'admin'
    });
    
    await broadcast.save();
    
    // Si envoi immédiat, envoyer maintenant
    if (!calculatedScheduledTime) {
      // Envoyer en arrière-plan pour ne pas bloquer la réponse
      sendBroadcastMessages(broadcast._id, users, message, sendAsAudio).catch(err => {
        logger.error('Erreur envoi broadcast en arrière-plan:', err);
      });
    }
    
    res.json({
      success: true,
      data: {
        broadcastId: broadcast._id,
        total: users.length,
        scheduledTime: calculatedScheduledTime,
        scheduledSlot: scheduledSlot,
        status: broadcast.status
      }
    });
  } catch (error) {
    logger.error('Erreur sendBroadcast:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Calcule l'heure d'envoi basée sur le créneau horaire
 */
function calculateScheduledTime(slot) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let targetHour = 0;
  
  switch (slot) {
    case '7h':
      targetHour = 7;
      break;
    case '12h-14h':
      // Envoyer à 12h (début du créneau)
      targetHour = 12;
      break;
    case '18h':
      targetHour = 18;
      break;
    default:
      return null;
  }
  
  const scheduledTime = new Date(today);
  scheduledTime.setHours(targetHour, 0, 0, 0);
  
  // Si l'heure est déjà passée aujourd'hui, programmer pour demain
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  return scheduledTime;
}

/**
 * Envoie les messages d'un broadcast
 */
async function sendBroadcastMessages(broadcastId, users, message, sendAsAudio) {
  const broadcast = await Broadcast.findById(broadcastId);
  if (!broadcast) return;
  
  broadcast.status = 'sending';
  await broadcast.save();
  
  // Utiliser la langue du message du broadcast, ou la langue de l'utilisateur en fallback
  const messageLanguage = broadcast.language || 'fr';
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of users) {
    try {
      if (sendAsAudio || user.preferredMode === 'audio') {
        // Utiliser la langue du message pour la conversion audio
        const audioLanguage = messageLanguage || user.language || 'fr';
        logger.info(`🎵 Conversion texte->audio pour ${user.phoneNumber} (langue: ${audioLanguage})`);
        const audioBuffer = await convertTextToAudio(message, audioLanguage);
        
        if (!audioBuffer || audioBuffer.length === 0) {
          logger.warn(`Buffer audio vide pour ${user.phoneNumber}, envoi en texte à la place`);
          // Fallback: envoyer en texte si la conversion audio échoue
          const result = await sendMessage(user.phoneNumber, message);
          if (!result.success) {
            throw new Error(result.error || 'Erreur envoi message');
          }
        } else {
          logger.info(`📤 Envoi audio (${audioBuffer.length} bytes) à ${user.phoneNumber}`);
          const result = await sendAudio(user.phoneNumber, audioBuffer, 'audio/mp3');
          if (!result.success) {
            throw new Error(result.error || 'Erreur envoi audio');
          }
        }
      } else {
        const result = await sendMessage(user.phoneNumber, message);
        if (!result.success) {
          throw new Error(result.error || 'Erreur envoi message');
        }
      }
      successCount++;
      
      // Délai pour éviter le rate limiting (plus long pour l'audio)
      const delay = (sendAsAudio || user.preferredMode === 'audio') ? 1000 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      logger.error(`Erreur envoi broadcast à ${user.phoneNumber}:`, error.message || error);
      errorCount++;
    }
  }
  
  broadcast.status = errorCount === 0 ? 'completed' : (successCount > 0 ? 'completed' : 'failed');
  broadcast.successCount = successCount;
  broadcast.errorCount = errorCount;
  broadcast.sentAt = new Date();
  await broadcast.save();
  
  logger.info(`Broadcast ${broadcastId} terminé: ${successCount} succès, ${errorCount} erreurs`);
}

/**
 * Récupère l'historique des broadcasts
 */
exports.getBroadcastHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const broadcasts = await Broadcast.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
    const total = await Broadcast.countDocuments();
    
    res.json({
      success: true,
      data: broadcasts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Erreur getBroadcastHistory:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Exporter la fonction pour le scheduler
exports.sendBroadcastMessages = sendBroadcastMessages;

