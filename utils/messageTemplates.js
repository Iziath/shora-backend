// Ce fichier peut être utilisé pour des templates de messages plus complexes
// Les messages de base sont dans config/constants.js

const { MESSAGES } = require('../config/constants');

/**
 * Génère un message personnalisé selon le contexte
 */
function getMessage(key, language = 'fr', variables = {}) {
  const messages = MESSAGES[language] || MESSAGES.fr;
  let message = messages[key] || '';
  
  // Remplacer les variables (ex: {name}, {points})
  Object.keys(variables).forEach(key => {
    message = message.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
  });
  
  return message;
}

/**
 * Formate un message d'incident pour les superviseurs
 */
function formatIncidentMessage(incident, user) {
  const severityEmoji = {
    low: '🟡',
    medium: '🟠',
    high: '🔴'
  };
  
  return `
⚠️ NOUVEL INCIDENT SIGNALÉ

${severityEmoji[incident.severity]} Gravité: ${incident.severity.toUpperCase()}
👷 Ouvrier: ${user.name || 'Anonyme'} (${user.phoneNumber})
🔧 Métier: ${user.profession}
📝 Description: ${incident.description}
📍 Localisation: ${incident.location || 'Non spécifiée'}
🕐 Heure: ${incident.reportedAt.toLocaleString('fr-FR')}

ID: ${incident._id}
  `.trim();
}

module.exports = {
  getMessage,
  formatIncidentMessage
};

