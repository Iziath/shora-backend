/**
 * Utilitaires pour le formatage des numéros de téléphone
 */

/**
 * Nettoie un numéro de téléphone (enlève +, espaces, tirets)
 * @param {string} phoneNumber - Numéro à nettoyer
 * @returns {string} - Numéro nettoyé (chiffres uniquement)
 */
function cleanPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/[^0-9]/g, '');
}

/**
 * Formate un numéro au format international +229XXXXXXXX
 * @param {string} phoneNumber - Numéro à formater
 * @returns {string} - Numéro formaté
 */
function formatInternational(phoneNumber) {
  const cleaned = cleanPhoneNumber(phoneNumber);
  
  // Si le numéro commence déjà par 229, retourner tel quel avec +
  if (cleaned.startsWith('229')) {
    return `+${cleaned}`;
  }
  
  // Si le numéro commence par 0, remplacer par 229
  if (cleaned.startsWith('0')) {
    return `+229${cleaned.substring(1)}`;
  }
  
  // Si le numéro a 9 chiffres, ajouter 229
  if (cleaned.length === 9) {
    return `+229${cleaned}`;
  }
  
  // Sinon, retourner avec + si nécessaire
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Formate un numéro pour WhatsApp (229XXXXXXXX@s.whatsapp.net)
 * @param {string} phoneNumber - Numéro à formater
 * @returns {string} - JID WhatsApp
 */
function formatWhatsAppJID(phoneNumber) {
  const cleaned = cleanPhoneNumber(phoneNumber);
  
  // Si le numéro commence par 229, utiliser tel quel
  if (cleaned.startsWith('229')) {
    return `${cleaned}@s.whatsapp.net`;
  }
  
  // Si le numéro commence par 0, remplacer par 229
  if (cleaned.startsWith('0')) {
    return `229${cleaned.substring(1)}@s.whatsapp.net`;
  }
  
  // Si le numéro a 9 chiffres, ajouter 229
  if (cleaned.length === 9) {
    return `229${cleaned}@s.whatsapp.net`;
  }
  
  // Sinon, utiliser tel quel
  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Extrait le numéro d'un JID WhatsApp
 * @param {string} jid - JID WhatsApp (ex: 229XXXXXXXX@s.whatsapp.net)
 * @returns {string} - Numéro extrait
 */
function extractPhoneFromJID(jid) {
  if (!jid) return '';
  const match = jid.match(/^(\d+)@/);
  return match ? match[1] : '';
}

/**
 * Valide un numéro de téléphone béninois
 * @param {string} phoneNumber - Numéro à valider
 * @returns {boolean} - True si valide
 */
function isValidBeninPhone(phoneNumber) {
  const cleaned = cleanPhoneNumber(phoneNumber);
  
  // Format béninois: 229XXXXXXXX (12 chiffres) ou 0XXXXXXXX (10 chiffres) ou XXXXXXXXX (9 chiffres)
  if (cleaned.startsWith('229') && cleaned.length === 12) {
    return true;
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return true;
  }
  
  if (cleaned.length === 9) {
    return true;
  }
  
  return false;
}

module.exports = {
  cleanPhoneNumber,
  formatInternational,
  formatWhatsAppJID,
  extractPhoneFromJID,
  isValidBeninPhone
};

