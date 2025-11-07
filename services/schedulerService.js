const cron = require('node-cron');
const User = require('../models/User');
const DailyTip = require('../models/DailyTip');
const Broadcast = require('../models/Broadcast');
const { sendMessage, sendAudio } = require('../whatsapp/sender');
const { convertTextToAudio } = require('./audioService');
const { MESSAGES } = require('../config/constants');
const broadcastController = require('../controllers/broadcastController');
const logger = require('../utils/logger');

/**
 * Planifie l'envoi des astuces quotidiennes
 * Envoie à 8h00 chaque jour
 */
function scheduleDailyTips() {
  // Cron: 0 8 * * * = Tous les jours à 8h00
  cron.schedule('0 8 * * *', async () => {
    logger.info('📅 Envoi des astuces quotidiennes...');
    
    try {
      // Récupérer tous les utilisateurs actifs ayant confirmé leur présence
      const activeUsers = await User.find({
        isActive: true,
        conversationState: 'active',
        hasScannedQR: true // Seuls les utilisateurs ayant confirmé leur présence
      });
      
      // Récupérer une astuce aléatoire pour chaque catégorie
      const tips = await DailyTip.find({ isActive: true });
      
      if (tips.length === 0) {
        logger.warn('Aucune astuce disponible');
        return;
      }
      
      let sentCount = 0;
      
      for (const user of activeUsers) {
        try {
          // Sélectionner une astuce pertinente pour le métier de l'utilisateur
          const relevantTips = tips.filter(tip => 
            tip.professions.length === 0 || 
            tip.professions.includes(user.profession)
          );
          
          const tip = relevantTips.length > 0
            ? relevantTips[Math.floor(Math.random() * relevantTips.length)]
            : tips[Math.floor(Math.random() * tips.length)];
          
          const tipContent = tip.content[user.language] || tip.content.fr;
          const messages = MESSAGES[user.language] || MESSAGES.fr;
          const message = `${messages.tip?.daily || "💡 Astuce du jour:"} ${tipContent}`;
          
          if (user.preferredMode === 'audio') {
            const audioBuffer = await convertTextToAudio(message, user.language);
            await sendAudio(user.phoneNumber, audioBuffer);
          } else {
            await sendMessage(user.phoneNumber, message);
          }
          
          sentCount++;
          
          // Petit délai pour éviter le rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`Erreur envoi astuce à ${user.phoneNumber}:`, error);
        }
      }
      
      logger.info(`✅ ${sentCount} astuces envoyées`);
    } catch (error) {
      logger.error('Erreur envoi astuces quotidiennes:', error);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Porto-Novo" // Fuseau horaire du Bénin
  });
  
  logger.info('✅ Planificateur d\'astuces quotidiennes activé (8h00 chaque jour)');
}

/**
 * Planifie le nettoyage des utilisateurs inactifs
 * Exécute tous les dimanches à minuit
 */
function scheduleCleanup() {
  // Cron: 0 0 * * 0 = Tous les dimanches à minuit
  cron.schedule('0 0 * * 0', async () => {
    logger.info('🧹 Nettoyage des utilisateurs inactifs...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await User.updateMany(
        {
          lastInteraction: { $lt: thirtyDaysAgo },
          isActive: true
        },
        {
          isActive: false,
          conversationState: 'inactive'
        }
      );
      
      logger.info(`✅ ${result.modifiedCount} utilisateurs marqués comme inactifs`);
    } catch (error) {
      logger.error('Erreur nettoyage utilisateurs:', error);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Porto-Novo"
  });
  
  logger.info('✅ Planificateur de nettoyage activé (dimanche minuit)');
}

/**
 * Planifie les relances d'inactivité
 * Envoie un message de réengagement aux utilisateurs inactifs depuis X jours
 */
function scheduleReengagement() {
  // Vérifier tous les jours à 10h00
  cron.schedule('0 10 * * *', async () => {
    logger.info('📧 Envoi des relances d\'inactivité...');
    
    try {
      // Nombre de jours d'inactivité (configurable via .env, défaut: 7)
      const inactiveDays = parseInt(process.env.INACTIVE_DAYS_THRESHOLD || '7');
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - inactiveDays);
      
      // Récupérer les utilisateurs actifs mais inactifs depuis X jours
      const inactiveUsers = await User.find({
        status: true, // Profil validé
        isActive: true,
        conversationState: 'active',
        lastInteraction: { $lt: thresholdDate }
      });
      
      if (inactiveUsers.length === 0) {
        logger.info('Aucun utilisateur inactif à relancer');
        return;
      }
      
      let sentCount = 0;
      
      for (const user of inactiveUsers) {
        try {
          const messages = {
            fr: `👋 Salut ${user.name || ''} ! On ne s'est pas parlé depuis un moment.\n\n` +
                `Tout va bien sur le chantier ? 🦺\n\n` +
                `Réponds *Oui* si tout va bien, ou *Danger* si tu as un problème.`,
            fon: `👋 Mido gbo ${user.name || ''} ! Mɛ ɖo nu tɔn ɖo gbɔ ɖo.\n\n` +
                 `Nukɔn ɖɔ wɛ ɖo gbɔ ? 🦺`,
            yoruba: `👋 Bawo ni ${user.name || ''} ! A ko ba sọrọ fun igba kan.\n\n` +
                    `Nje o wa daadaa ni ile iṣẹ ? 🦺`
          };
          
          const message = messages[user.language] || messages.fr;
          
          if (user.preferredMode === 'audio') {
            const { convertTextToAudio } = require('./audioService');
            const { sendAudio } = require('../whatsapp/sender');
            const audioBuffer = await convertTextToAudio(message, user.language);
            await sendAudio(user.phoneNumber, audioBuffer);
          } else {
            const { sendMessage } = require('../whatsapp/sender');
            await sendMessage(user.phoneNumber, message);
          }
          
          // Mettre à jour lastInteraction pour éviter les relances multiples
          user.lastInteraction = new Date();
          await user.save();
          
          sentCount++;
          
          // Délai pour éviter le rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`Erreur relance à ${user.phoneNumber}:`, error);
        }
      }
      
      logger.info(`✅ ${sentCount} relances envoyées`);
    } catch (error) {
      logger.error('Erreur envoi relances:', error);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Porto-Novo"
  });
  
  logger.info('✅ Planificateur de relances activé (10h00 chaque jour)');
}

/**
 * Planifie l'envoi des broadcasts programmés
 * Vérifie toutes les minutes les broadcasts à envoyer
 */
function scheduleBroadcasts() {
  // Vérifier toutes les minutes
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Récupérer les broadcasts programmés qui doivent être envoyés maintenant
      const pendingBroadcasts = await Broadcast.find({
        status: 'pending',
        scheduledTime: { $lte: now }
      });
      
      if (pendingBroadcasts.length === 0) {
        return;
      }
      
      logger.info(`📢 ${pendingBroadcasts.length} broadcast(s) programmé(s) à envoyer`);
      
      for (const broadcast of pendingBroadcasts) {
        try {
          // Construire le filtre pour les destinataires
          const filter = { 
            isActive: true, 
            conversationState: 'active',
            hasScannedQR: true // Seuls les utilisateurs ayant confirmé leur présence
          };
          
          if (broadcast.targetProfessions && broadcast.targetProfessions.length > 0) {
            filter.profession = { $in: broadcast.targetProfessions };
          }
          
          if (broadcast.targetLanguage) {
            filter.language = broadcast.targetLanguage;
          }
          
          // Récupérer les utilisateurs cibles
          const users = await User.find(filter);
          
          if (users.length > 0) {
            await broadcastController.sendBroadcastMessages(
              broadcast._id, 
              users, 
              broadcast.message, 
              broadcast.sendAsAudio
            );
          } else {
            broadcast.status = 'failed';
            broadcast.errorCount = 0;
            broadcast.sentAt = new Date();
            await broadcast.save();
            logger.warn(`Broadcast ${broadcast._id}: Aucun destinataire trouvé`);
          }
        } catch (error) {
          logger.error(`Erreur envoi broadcast ${broadcast._id}:`, error);
          broadcast.status = 'failed';
          await broadcast.save();
        }
      }
    } catch (error) {
      logger.error('Erreur vérification broadcasts programmés:', error);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Porto-Novo"
  });
  
  logger.info('✅ Planificateur de broadcasts activé (vérification chaque minute)');
}

/**
 * Initialise tous les planificateurs
 */
function initializeSchedulers() {
  scheduleDailyTips();
  scheduleCleanup();
  scheduleBroadcasts();
  scheduleReengagement();
  logger.info('✅ Tous les planificateurs sont initialisés');
}

module.exports = {
  initializeSchedulers,
  scheduleDailyTips,
  scheduleCleanup,
  scheduleBroadcasts,
  scheduleReengagement
};

