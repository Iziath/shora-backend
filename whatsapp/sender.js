const logger = require('../utils/logger');

// Chargement différé pour éviter les dépendances circulaires
function getSocket() {
  return require('./client').getSocket();
}

function isConnected() {
  return require('./client').isConnected();
}

/**
 * Formate un numéro de téléphone pour WhatsApp
 */
function formatPhoneNumber(phoneNumber) {
  // Nettoyer le numéro (enlever espaces, tirets, etc.)
  let cleaned = phoneNumber.replace(/[^0-9+]/g, '');
  
  // Si commence par +, garder tel quel, sinon ajouter +
  if (!cleaned.startsWith('+')) {
    // Si commence par 229 (code Bénin), ajouter +
    if (cleaned.startsWith('229')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 8) {
      // Numéro local béninois, ajouter +229
      cleaned = '+229' + cleaned;
    } else {
      // Autre format, essayer d'ajouter +
      cleaned = '+' + cleaned;
    }
  }
  
  // Retirer le + pour le JID et ajouter @s.whatsapp.net
  const jid = cleaned.replace('+', '') + '@s.whatsapp.net';
  return { jid, formatted: cleaned };
}

/**
 * Envoie un message texte
 */
async function sendMessage(phoneNumber, text) {
  try {
    const socket = getSocket();
    
    // Vérifier que WhatsApp est connecté
    if (!socket || !isConnected()) {
      logger.error('WhatsApp non connecté - Impossible d\'envoyer le message');
      return { success: false, error: 'WhatsApp non connecté' };
    }
    
    if (!text || text.trim().length === 0) {
      logger.warn('Tentative d\'envoi de message vide');
      return { success: false, error: 'Message vide' };
    }
    
    // Formater le numéro
    const { jid, formatted } = formatPhoneNumber(phoneNumber);
    
    logger.info(`📤 Envoi message à ${formatted} (${jid})`);
    
    // Envoyer le message
    await socket.sendMessage(jid, { text: text.trim() });
    
    logger.info(`✅ Message envoyé avec succès à ${formatted}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Erreur envoi message à ${phoneNumber}:`, error.message);
    logger.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un message audio
 */
async function sendAudio(phoneNumber, audioBuffer, mimetype = 'audio/mp3') {
  try {
    const socket = getSocket();
    
    // Vérifier que WhatsApp est connecté
    if (!socket || !isConnected()) {
      logger.error('WhatsApp non connecté - Impossible d\'envoyer l\'audio');
      return { success: false, error: 'WhatsApp non connecté' };
    }
    
    if (!audioBuffer) {
      logger.warn('Tentative d\'envoi d\'audio avec buffer null');
      return { success: false, error: 'Buffer audio null' };
    }
    
    // Convertir en Buffer si nécessaire
    let buffer = audioBuffer;
    if (!Buffer.isBuffer(audioBuffer)) {
      if (audioBuffer instanceof ArrayBuffer) {
        buffer = Buffer.from(audioBuffer);
      } else if (Array.isArray(audioBuffer)) {
        buffer = Buffer.from(audioBuffer);
      } else {
        logger.warn('Format de buffer audio non reconnu, tentative de conversion');
        buffer = Buffer.from(audioBuffer);
      }
    }
    
    if (buffer.length === 0) {
      logger.warn('Tentative d\'envoi d\'audio vide');
      return { success: false, error: 'Buffer audio vide' };
    }
    
    // Formater le numéro
    const { jid, formatted } = formatPhoneNumber(phoneNumber);
    
    logger.info(`📤 Envoi audio (${buffer.length} bytes, ${mimetype}) à ${formatted} (${jid})`);
    
    // Envoyer l'audio via WhatsApp
    await socket.sendMessage(jid, {
      audio: buffer,
      mimetype: mimetype || 'audio/mp3',
      ptt: false // Pas de push-to-talk (voice message)
    });
    
    logger.info(`✅ Audio envoyé avec succès à ${formatted}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Erreur envoi audio à ${phoneNumber}:`, error.message);
    logger.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une image
 */
async function sendImage(phoneNumber, imageBuffer, mimetype = 'image/jpeg', caption = '') {
  try {
    const socket = getSocket();
    
    // Vérifier que WhatsApp est connecté
    if (!socket || !isConnected()) {
      logger.error('WhatsApp non connecté - Impossible d\'envoyer l\'image');
      return { success: false, error: 'WhatsApp non connecté' };
    }
    
    if (!imageBuffer || imageBuffer.length === 0) {
      logger.warn('Tentative d\'envoi d\'image vide');
      return { success: false, error: 'Buffer image vide' };
    }
    
    // Formater le numéro
    const { jid, formatted } = formatPhoneNumber(phoneNumber);
    
    logger.info(`📤 Envoi image à ${formatted} (${jid})`);
    
    await socket.sendMessage(jid, {
      image: imageBuffer,
      mimetype: mimetype || 'image/jpeg',
      caption: caption || ''
    });
    
    logger.info(`✅ Image envoyée avec succès à ${formatted}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Erreur envoi image à ${phoneNumber}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un message avec des boutons interactifs
 */
async function sendButtons(phoneNumber, text, buttons) {
  try {
    const socket = getSocket();
    
    // Vérifier que WhatsApp est connecté
    if (!socket || !isConnected()) {
      logger.error('WhatsApp non connecté - Impossible d\'envoyer les boutons');
      return { success: false, error: 'WhatsApp non connecté' };
    }
    
    if (!text || text.trim().length === 0) {
      logger.warn('Tentative d\'envoi de message avec boutons vide');
      return { success: false, error: 'Message vide' };
    }
    
    if (!buttons || buttons.length === 0) {
      logger.warn('Aucun bouton fourni');
      return { success: false, error: 'Aucun bouton fourni' };
    }
    
    // Formater le numéro
    const { jid, formatted } = formatPhoneNumber(phoneNumber);
    
    logger.info(`📤 Envoi message avec boutons à ${formatted} (${jid})`);
    
    // Formater les boutons pour Baileys (format correct)
    // Baileys utilise un format spécifique pour les boutons interactifs
    const buttonRows = buttons.map((button, index) => ({
      buttonId: button.id || `btn_${index}`,
      buttonText: { displayText: button.text },
      type: 1 // Type 1 = bouton de réponse rapide
    }));
    
    // Envoyer le message avec boutons (format Baileys)
    // Note: Le format peut varier selon la version de Baileys
    // Si cela ne fonctionne pas, on peut utiliser un message texte avec des options numérotées
    try {
      await socket.sendMessage(jid, {
        text: text.trim(),
        buttons: buttonRows,
        headerType: 1
      });
    } catch (buttonError) {
      // Fallback: envoyer un message texte avec options numérotées
      logger.warn('Erreur envoi boutons, fallback vers message texte:', buttonError.message);
      const optionsText = buttonRows.map((btn, idx) => `${idx + 1}. ${btn.buttonText.displayText}`).join('\n');
      await socket.sendMessage(jid, { text: `${text.trim()}\n\n${optionsText}` });
    }
    
    logger.info(`✅ Message avec boutons envoyé avec succès à ${formatted}`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Erreur envoi boutons à ${phoneNumber}:`, error.message);
    logger.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendMessage,
  sendAudio,
  sendImage,
  sendButtons
};

