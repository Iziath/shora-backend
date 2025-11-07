// backend/whatsapp/handler.js
/**
 * 📨 HANDLER PRINCIPAL DES MESSAGES WHATSAPP
 * Reçoit les messages de client.js et les transmet à botService
 */

const BotService = require('../services/botService');
const { sendMessage } = require('./sender');
const { formatInternational } = require('../utils/phoneFormatter');
const logger = require('../utils/logger');

// Instance du service bot (singleton)
let botServiceInstance = null;

/**
 * 🎯 INITIALISER LE HANDLER
 */
function initializeHandler() {
  if (!botServiceInstance) {
    botServiceInstance = new BotService(sendMessage);
    logger.info('✅ Handler de messages initialisé');
  }
  return botServiceInstance;
}

/**
 * 📨 HANDLER PRINCIPAL DES MESSAGES ENTRANTS
 * Cette fonction est appelée automatiquement par client.js
 */
async function handleIncomingMessage(phoneNumber, messageText, messageType = 'text', mediaUrl = null) {
  try {
    // S'assurer que le bot est initialisé
    if (!botServiceInstance) {
      initializeHandler();
    }

    // Formater le numéro au format international
    const formattedNumber = formatInternational(phoneNumber);

    logger.info(`\n🤖 SHORA traite le message:`);
    logger.info(`   📞 Numéro: ${formattedNumber}`);
    logger.info(`   💬 Message: ${messageText || '(vide)'}`);
    logger.info(`   📋 Type: ${messageType}\n`);

    // ========== APPELER LE BOT SERVICE ==========
    await botServiceInstance.handleMessage(
      formattedNumber,
      messageText || '',
      messageType,
      mediaUrl
    );

    return { success: true };

  } catch (error) {
    logger.error('❌ Erreur handler:', error);
    
    // Message d'erreur à l'utilisateur
    try {
      await sendMessage(phoneNumber, 
        "😔 Désolé, une erreur s'est produite.\n\n" +
        "Réessayez en écrivant *Bonjour* ou *Aide*"
      );
    } catch (sendError) {
      logger.error('❌ Impossible d\'envoyer le message d\'erreur:', sendError);
    }

    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeHandler,
  handleIncomingMessage
};