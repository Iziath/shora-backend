const Incident = require('../models/Incident');
const User = require('../models/User');
const { sendMessage } = require('../whatsapp/sender');
const logger = require('../utils/logger');

/**
 * Notifie les superviseurs d'un nouvel incident
 */
async function notifySupervisors(incident) {
  try {
    // Récupérer les informations de l'incident
    const incidentData = await Incident.findById(incident._id)
      .populate('userId', 'name phoneNumber profession');
    
    if (!incidentData) {
      logger.error('Incident non trouvé pour notification');
      return;
    }
    
    const user = incidentData.userId;
    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴'
    };
    
    const message = `
⚠️ NOUVEL INCIDENT SIGNALÉ

${severityEmoji[incident.severity]} Gravité: ${incident.severity.toUpperCase()}
👷 Ouvrier: ${user.name || 'Anonyme'} (${user.phoneNumber})
🔧 Métier: ${user.profession}
📝 Description: ${incident.description}
📍 Localisation: ${incident.location || 'Non spécifiée'}
🕐 Heure: ${incident.reportedAt.toLocaleString('fr-FR')}

ID: ${incident._id}
    `.trim();
    
    // Récupérer la liste des superviseurs depuis la variable d'environnement
    const supervisorPhones = process.env.SUPERVISOR_PHONES?.split(',') || [];
    
    if (supervisorPhones.length === 0) {
      logger.warn('⚠️ Aucun numéro de superviseur configuré dans SUPERVISOR_PHONES');
      return;
    }
    
    logger.info(`📢 Envoi de notifications à ${supervisorPhones.length} superviseur(s)`);
    
    // Envoyer à tous les superviseurs
    let successCount = 0;
    let errorCount = 0;
    
    for (const phone of supervisorPhones) {
      const trimmedPhone = phone.trim();
      if (trimmedPhone) {
        try {
          const result = await sendMessage(trimmedPhone, message);
          if (result.success) {
            successCount++;
            logger.info(`✅ Notification envoyée à ${trimmedPhone}`);
          } else {
            errorCount++;
            logger.error(`❌ Échec envoi notification à ${trimmedPhone}: ${result.error}`);
          }
        } catch (error) {
          errorCount++;
          logger.error(`❌ Erreur envoi notification à ${trimmedPhone}:`, error.message);
        }
        
        // Petit délai entre les envois pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info(`📊 Notifications: ${successCount} réussies, ${errorCount} échouées pour l'incident ${incident._id}`);
  } catch (error) {
    logger.error('Erreur notification superviseurs:', error);
  }
}

/**
 * Envoie une alerte de rappel pour un incident non résolu
 */
async function remindUnresolvedIncidents() {
  try {
    const unresolvedIncidents = await Incident.find({
      status: { $in: ['open', 'in-progress'] },
      reportedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Plus de 24h
    }).populate('userId', 'name phoneNumber');
    
    if (unresolvedIncidents.length === 0) {
      return;
    }
    
    const supervisorPhones = process.env.SUPERVISOR_PHONES?.split(',') || [];
    const message = `
🔔 RAPPEL: ${unresolvedIncidents.length} incident(s) non résolu(s) depuis plus de 24h

Veuillez consulter le dashboard pour plus de détails.
    `.trim();
    
    for (const phone of supervisorPhones) {
      if (phone.trim()) {
        await sendMessage(phone.trim(), message);
      }
    }
    
    logger.info(`Rappels envoyés pour ${unresolvedIncidents.length} incidents`);
  } catch (error) {
    logger.error('Erreur rappel incidents:', error);
  }
}

module.exports = {
  notifySupervisors,
  remindUnresolvedIncidents
};

