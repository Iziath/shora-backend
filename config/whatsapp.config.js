/**
 * Configuration Baileys pour WhatsApp
 * Centralise tous les paramètres de connexion WhatsApp
 */

const path = require('path');

/**
 * Configuration par défaut pour Baileys
 */
const baileysConfig = {
  // Nom de l'agent WhatsApp (affiché dans les informations de connexion)
  browser: ['SHORA', 'Chrome', '1.0.0'],
  
  // Ne pas afficher le QR dans le terminal (on le génère via API)
  printQRInTerminal: false,
  
  // Marquer comme en ligne pour recevoir les messages
  markOnlineOnConnect: true,
  
  // Dossier de session (stockage des credentials)
  sessionPath: path.join(__dirname, '../whatsapp/session'),
  
  // Options de reconnexion
  reconnect: {
    // Délai avant reconnexion (ms)
    delay: 5000,
    // Nombre maximum de tentatives
    maxRetries: 10
  },
  
  // Options de message
  message: {
    // Retry en cas d'échec d'envoi
    retryCount: 3,
    // Timeout pour l'envoi (ms)
    timeout: 30000
  },
  
  // Options de synchronisation
  sync: {
    // Synchroniser les contacts
    syncContacts: true,
    // Synchroniser les groupes
    syncGroups: true
  },
  
  // Options de génération QR
  qr: {
    // Taille du QR code
    size: 300,
    // Niveau de correction d'erreur
    errorCorrectionLevel: 'M'
  }
};

/**
 * Configuration pour l'envoi de messages
 */
const messageConfig = {
  // Délai entre chaque message (ms) - pour éviter le rate limiting
  delayBetweenMessages: 1000,
  
  // Nombre maximum de messages par minute
  maxMessagesPerMinute: 20,
  
  // Timeout pour l'envoi d'un message (ms)
  sendTimeout: 30000,
  
  // Retry en cas d'échec
  retryCount: 3,
  retryDelay: 2000
};

/**
 * Configuration pour l'envoi d'audio
 */
const audioConfig = {
  // Format audio par défaut
  format: 'mp3',
  
  // Qualité audio
  quality: 'high',
  
  // Langue par défaut pour TTS
  defaultLanguage: 'fr',
  
  // Taux d'échantillonnage
  sampleRate: 22050
};

/**
 * Configuration pour les boutons interactifs
 */
const buttonConfig = {
  // Nombre maximum de boutons par message
  maxButtons: 3,
  
  // Texte maximum par bouton
  maxButtonTextLength: 20
};

/**
 * Configuration pour le chatbot
 */
const botConfig = {
  // Nom du bot (affiché dans WhatsApp)
  name: 'SHORA',
  
  // Description du bot (statut WhatsApp)
  description: 'Compte professionnel',
  
  // Description complète
  fullDescription: 'Assistant sécurité au travail',
  
  // Langues supportées
  supportedLanguages: ['fr', 'fon', 'yoruba'],
  
  // Délai de réponse automatique (ms)
  autoReplyDelay: 1000,
  
  // Messages de bienvenue
  welcomeMessages: {
    fr: "👋 Bonjour ! Merci de prendre SHORA comme votre ami.\n\nComment vous vous appelez ?",
    fon: "👋 Mido gbo ! Mɛ ɖo SHORA ɖo nu tɔn.\n\nNukɔn ɖɔ wɛ ?",
    yoruba: "👋 Bawo ni! Jọwọ gba SHORA bi ọrẹ rẹ.\n\nKini orukọ rẹ?"
  }
};

module.exports = {
  baileysConfig,
  messageConfig,
  audioConfig,
  buttonConfig,
  botConfig
};

