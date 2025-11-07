// backend/services/nlpService.js

/**
 * 🧠 SERVICE NLP SIMPLE (Détection par mots-clés)
 * Pour un MVP, on utilise des mots-clés. Plus tard, intégrer DialogFlow ou Wit.ai
 */

const KEYWORDS = {
  danger: [
    'danger', 'accident', 'urgent', 'urgence', 'secours', 'aide',
    'blessé', 'blessure', 'tombé', 'chute', 'electrocution',
    'feu', 'incendie', 'risque', 'alerte', 'probleme', 'problème',
    'attention', 'sos'
  ],
  
  help: [
    'aide', 'help', 'commande', 'comment', 'quoi faire',
    'fonctionnement', 'utiliser', 'menu'
  ],
  
  quiz: [
    'quiz', 'test', 'question', 'connaissance', 'jeu'
  ],
  
  profile: [
    'profil', 'info', 'informations', 'mes données', 'compte'
  ],
  
  greeting: [
    'bonjour', 'salut', 'hello', 'hey', 'hi', 'bonsoir', 'coucou'
  ]
};

/**
 * 🎯 DÉTECTER L'INTENTION DU MESSAGE
 */
function detectIntent(message) {
  if (!message || typeof message !== 'string') {
    return 'unknown';
  }

  const lowerMessage = message.toLowerCase().trim();

  // Priorité aux dangers (plus important)
  if (containsKeywords(lowerMessage, KEYWORDS.danger)) {
    return 'danger';
  }

  if (containsKeywords(lowerMessage, KEYWORDS.help)) {
    return 'help';
  }

  if (containsKeywords(lowerMessage, KEYWORDS.quiz)) {
    return 'quiz';
  }

  if (containsKeywords(lowerMessage, KEYWORDS.profile)) {
    return 'profile';
  }

  if (containsKeywords(lowerMessage, KEYWORDS.greeting)) {
    return 'greeting';
  }

  return 'unknown';
}

/**
 * 🔍 VÉRIFIER SI LE MESSAGE CONTIENT DES MOTS-CLÉS
 */
function containsKeywords(message, keywords) {
  return keywords.some(keyword => message.includes(keyword));
}

/**
 * 📊 ANALYSER LE SENTIMENT (Simple)
 */
function analyzeSentiment(message) {
  const positiveWords = ['merci', 'bien', 'super', 'génial', 'parfait', 'content', 'ok'];
  const negativeWords = ['pas', 'non', 'mauvais', 'problème', 'erreur', 'bug'];

  const lowerMessage = message.toLowerCase();

  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * 🔢 EXTRAIRE DES NOMBRES DU MESSAGE
 */
function extractNumbers(message) {
  const matches = message.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

/**
 * 📧 DÉTECTER UN NUMÉRO DE TÉLÉPHONE
 */
function extractPhoneNumber(message) {
  const phoneRegex = /(\+?229)?[\s]?(\d{8})/g;
  const match = message.match(phoneRegex);
  return match ? match[0].replace(/\s/g, '') : null;
}

/**
 * 📍 EXTRAIRE UNE LOCALISATION (Simple)
 */
function extractLocation(message) {
  const locationKeywords = ['à', 'au', 'près de', 'zone', 'chantier'];
  const words = message.split(' ');

  for (let i = 0; i < words.length; i++) {
    if (locationKeywords.includes(words[i].toLowerCase()) && words[i + 1]) {
      return words.slice(i + 1, i + 4).join(' ');
    }
  }

  return null;
}

module.exports = {
  detectIntent,
  containsKeywords,
  analyzeSentiment,
  extractNumbers,
  extractPhoneNumber,
  extractLocation
};