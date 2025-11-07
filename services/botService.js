// backend/services/botService.js
/**
 * 🤖 SERVICE BOT - Logique conversationnelle complète
 * Gère le flux d'onboarding : bienvenue → mode → métier → chantier → langue → confirmation → status = true
 * Gère aussi les incidents, quiz, et interactions actives
 */

const User = require('../models/User');
const Interaction = require('../models/Interaction');
const Incident = require('../models/Incident');
const nlpService = require('./nlpService');
const { sendMessage, sendAudio } = require('../whatsapp/sender');
const { convertTextToAudio } = require('./audioService');
const axios = require('axios');
const logger = require('../utils/logger');
const { formatInternational } = require('../utils/phoneFormatter');

class BotService {
  constructor(sendMessageFunction) {
    this.sendMessage = sendMessageFunction || sendMessage;
  }

  /**
   * 🎯 POINT D'ENTRÉE PRINCIPAL - Gère TOUS les messages automatiquement
   */
  async handleMessage(phoneNumber, messageText, messageType = 'text', mediaUrl = null) {
    try {
      // Normaliser le message
      const messageTextNormalized = messageText || '';
      const messageLower = messageTextNormalized.toLowerCase().trim();

      // Formater le numéro
      const cleanPhone = formatInternational(phoneNumber);
      
      // Chercher ou créer l'utilisateur
      let user = await User.findOne({ phoneNumber: cleanPhone });

      // ========== 1️⃣ NOUVEL UTILISATEUR ==========
      if (!user) {
        user = await User.create({
          phoneNumber: cleanPhone,
          status: false, // Profil non validé
          conversationState: 'new',
          preferredMode: null
        });
        
        // Enregistrer l'interaction initiale
        await this.logInteraction(user._id, 'other', messageTextNormalized || 'Premier contact');
        
        // Envoyer le message de bienvenue
        return await this.sendWelcomeMessage(user);
      }

      // Mettre à jour lastInteraction
      user.lastInteraction = new Date();
      await user.save();

      // Enregistrer l'interaction
      await this.logInteraction(user._id, 'response', messageTextNormalized);

      // ========== 2️⃣ DÉTECTION MOTS-CLÉS SPÉCIAUX (priorité) ==========
      const intent = nlpService.detectIntent(messageTextNormalized);
      
      // Détection "Danger" ou "Incident" (priorité absolue)
      if (intent === 'danger' || messageLower.includes('danger') || messageLower.includes('incident')) {
        return await this.handleDangerReport(user, messageTextNormalized, mediaUrl);
      }

      // ========== 3️⃣ MACHINE D'ÉTATS - Gestion du flux conversationnel ==========
      switch (user.conversationState) {
        case 'new':
          // Premier message après création
          return await this.sendWelcomeMessage(user);
          
        case 'awaiting_mode':
          // Attente du choix texte/audio
          return await this.handleModeChoice(user, messageTextNormalized);
          
        case 'awaiting_profession':
          // Attente du métier
          return await this.handleProfessionResponse(user, messageTextNormalized);
          
        case 'awaiting_site_type':
          // Attente du type de chantier
          return await this.handleSiteTypeResponse(user, messageTextNormalized);
          
        case 'awaiting_language':
          // Attente de la langue
          return await this.handleLanguageResponse(user, messageTextNormalized);
          
        case 'awaiting_confirmation':
          // Attente de la confirmation finale
          return await this.handleConfirmationResponse(user, messageTextNormalized);
          
        case 'active':
          // Utilisateur actif - gérer les interactions normales
          return await this.handleActiveUser(user, messageTextNormalized, intent);
          
        default:
          // État inconnu, réinitialiser
          user.conversationState = 'new';
          await user.save();
          return await this.sendWelcomeMessage(user);
      }
    } catch (error) {
      logger.error('❌ Erreur botService.handleMessage:', error);
      try {
        await this.sendMessage(phoneNumber, 
          "😔 Désolé, une erreur s'est produite.\n\n" +
          "Réessayez en écrivant *Bonjour* ou *Aide*"
        );
      } catch (sendError) {
        logger.error('❌ Impossible d\'envoyer le message d\'erreur:', sendError);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * 👋 MESSAGE DE BIENVENUE (première interaction)
   */
  async sendWelcomeMessage(user) {
    const message = "Salut 👋 Je suis Shora, ton compagnon sécurité sur le chantier. Tu veux qu'on parle en texte ou en audio ?";
    
    user.conversationState = 'awaiting_mode';
    await user.save();
    
    await this.sendMessage(user.phoneNumber, message);
    await this.logInteraction(user._id, 'tip', 'Message de bienvenue');
    
    return { success: true };
  }

  /**
   * 🎤 CHOIX MODE (Texte ou Audio)
   */
  async handleModeChoice(user, response) {
    const responseLower = response.toLowerCase().trim();
    
    // Détection mode texte
    if (responseLower.includes('texte') || responseLower.includes('text') || 
        responseLower.includes('écrit') || responseLower.includes('ecrit') ||
        responseLower === '1' || responseLower === 't') {
      user.preferredMode = 'text';
      user.conversationState = 'awaiting_profession';
      await user.save();
      
      await this.sendMessage(user.phoneNumber, 
        "✅ Mode texte activé 📝\n\n" +
        "Quel est ton métier ?"
      );
      await this.logInteraction(user._id, 'response', 'Mode: texte');
      return { success: true };
    }
    
    // Détection mode audio
    if (responseLower.includes('audio') || responseLower.includes('voix') ||
        responseLower === '2' || responseLower === 'a') {
      user.preferredMode = 'audio';
      user.conversationState = 'awaiting_profession';
      await user.save();
      
      // Envoyer en audio si possible
      try {
        const audioMessage = "Mode audio activé. Quel est ton métier ?";
        const audioBuffer = await convertTextToAudio(audioMessage, 'fr');
        await sendAudio(user.phoneNumber, audioBuffer);
      } catch (audioError) {
        // Fallback sur texte si audio échoue
        await this.sendMessage(user.phoneNumber, 
          "✅ Mode audio activé 🎤\n\n" +
          "Quel est ton métier ?"
        );
      }
      await this.logInteraction(user._id, 'response', 'Mode: audio');
      return { success: true };
    }
    
    // Réponse non reconnue
    await this.sendMessage(user.phoneNumber, 
      "❌ Réponds par *Texte* ou *Audio*"
    );
    return { success: false };
  }

  /**
   * 👷 RÉPONSE MÉTIER
   */
  async handleProfessionResponse(user, response) {
    const responseLower = response.toLowerCase().trim();
    
    const professions = {
      'maçon': 'maçon', 'macon': 'maçon', '1': 'maçon',
      'électricien': 'électricien', 'electricien': 'électricien', '2': 'électricien',
      'plombier': 'plombier', '3': 'plombier',
      'charpentier': 'charpentier', '4': 'charpentier',
      'peintre': 'peintre', '5': 'peintre',
      'manœuvre': 'manœuvre', 'manoeuvre': 'manœuvre', '6': 'manœuvre',
      'autre': 'autre', '7': 'autre'
    };
    
    const profession = professions[responseLower];
    
    if (!profession) {
      await this.sendMessage(user.phoneNumber, 
        "❌ Métier non reconnu.\n\n" +
        "Réponds par : Maçon, Électricien, Plombier, Charpentier, Peintre, Manœuvre, ou Autre"
      );
      return { success: false };
    }
    
    user.profession = profession;
    user.conversationState = 'awaiting_site_type';
    await user.save();
    
    const message = `✅ Métier : ${profession}\n\nQuel type de chantier tu fais le plus souvent ?`;
    
    if (user.preferredMode === 'audio') {
      try {
        const audioBuffer = await convertTextToAudio(message, user.language || 'fr');
        await sendAudio(user.phoneNumber, audioBuffer);
      } catch (audioError) {
        await this.sendMessage(user.phoneNumber, message);
      }
    } else {
      await this.sendMessage(user.phoneNumber, message);
    }
    
    await this.logInteraction(user._id, 'response', `Métier: ${profession}`);
    return { success: true };
  }

  /**
   * 🏗️ RÉPONSE TYPE DE CHANTIER
   */
  async handleSiteTypeResponse(user, response) {
    const responseLower = response.toLowerCase().trim();
    
    const siteTypes = {
      'construction': 'construction', 'construction neuve': 'construction', '1': 'construction',
      'rénovation': 'rénovation', 'renovation': 'rénovation', '2': 'rénovation',
      'infrastructure': 'infrastructure', '3': 'infrastructure',
      'autre': 'autre', '4': 'autre'
    };
    
    const siteType = siteTypes[responseLower];
    
    if (!siteType) {
      await this.sendMessage(user.phoneNumber, 
        "❌ Type de chantier non reconnu.\n\n" +
        "Réponds par : Construction, Rénovation, Infrastructure, ou Autre"
      );
      return { success: false };
    }
    
    user.chantierType = siteType;
    user.conversationState = 'awaiting_language';
    await user.save();
    
    const message = `✅ Type de chantier : ${siteType}\n\nDans quelle langue tu veux que je te parle ?`;
    
    if (user.preferredMode === 'audio') {
      try {
        const audioBuffer = await convertTextToAudio(message, user.language || 'fr');
        await sendAudio(user.phoneNumber, audioBuffer);
      } catch (audioError) {
        await this.sendMessage(user.phoneNumber, message);
      }
    } else {
      await this.sendMessage(user.phoneNumber, message);
    }
    
    await this.logInteraction(user._id, 'response', `Type chantier: ${siteType}`);
    return { success: true };
  }

  /**
   * 🗣️ RÉPONSE LANGUE
   */
  async handleLanguageResponse(user, response) {
    const responseLower = response.toLowerCase().trim();
    
    const languages = {
      'français': 'fr', 'francais': 'fr', 'fr': 'fr', '1': 'fr',
      'fon': 'fon', '2': 'fon',
      'yoruba': 'yoruba', 'yorouba': 'yoruba', '3': 'yoruba'
    };
    
    const language = languages[responseLower];
    
    if (!language) {
      await this.sendMessage(user.phoneNumber, 
        "❌ Langue non reconnue.\n\n" +
        "Réponds par : Français, Fon, ou Yoruba"
      );
      return { success: false };
    }
    
    user.language = language;
    user.conversationState = 'awaiting_confirmation';
    await user.save();
    
    // Créer le récapitulatif
    const summary = this.createProfileSummary(user);
    const message = `Merci — c'est bien :\n\n${summary}\n\nTu confirmes ? (Oui / Non)`;
    
    if (user.preferredMode === 'audio') {
      try {
        const audioBuffer = await convertTextToAudio(message, language);
        await sendAudio(user.phoneNumber, audioBuffer);
      } catch (audioError) {
        await this.sendMessage(user.phoneNumber, message);
      }
    } else {
      await this.sendMessage(user.phoneNumber, message);
    }
    
    await this.logInteraction(user._id, 'response', `Langue: ${language}`);
    return { success: true };
  }

  /**
   * ✅ RÉPONSE CONFIRMATION
   */
  async handleConfirmationResponse(user, response) {
    const responseLower = response.toLowerCase().trim();
    
    // Détection confirmation positive
    if (responseLower.includes('oui') || responseLower.includes('yes') || 
        responseLower.includes('ok') || responseLower === 'o') {
      
      // ✅ VALIDATION DU PROFIL - status = true
      user.status = true;
      user.conversationState = 'active';
      user.isActive = true;
      await user.save();
      
      const message = `🎉 Profil validé ! Bienvenue ${user.name || 'sur SHORA'} !\n\n` +
        `Tu recevras maintenant des conseils quotidiens de sécurité 🦺\n\n` +
        `Tape *Danger* pour signaler un incident, *Aide* pour plus d'infos.`;
      
      if (user.preferredMode === 'audio') {
        try {
          const audioBuffer = await convertTextToAudio(message, user.language);
          await sendAudio(user.phoneNumber, audioBuffer);
        } catch (audioError) {
          await this.sendMessage(user.phoneNumber, message);
        }
      } else {
        await this.sendMessage(user.phoneNumber, message);
      }
      
      await this.logInteraction(user._id, 'onboarding', 'Profil validé');
      return { success: true };
    }
    
    // Détection confirmation négative
    if (responseLower.includes('non') || responseLower.includes('no') || 
        responseLower === 'n') {
      
      // Permettre la modification
      await this.sendMessage(user.phoneNumber, 
        "D'accord, on recommence !\n\n" +
        "Quel est ton métier ?"
      );
      user.conversationState = 'awaiting_profession';
      await user.save();
      return { success: true };
    }
    
    // Réponse non reconnue
    await this.sendMessage(user.phoneNumber, 
      "❌ Réponds par *Oui* ou *Non*"
    );
    return { success: false };
  }

  /**
   * 💬 UTILISATEUR ACTIF - Gestion des interactions normales
   */
  async handleActiveUser(user, messageText, intent) {
    // Gérer les intents spéciaux
    if (intent === 'help') {
      return await this.sendHelpMessage(user);
    }
    
    if (intent === 'quiz') {
      return await this.sendQuiz(user);
    }
    
    if (intent === 'profile') {
      return await this.sendProfile(user);
    }
    
    // Réaction aux emojis
    if (messageText.includes('👍')) {
      user.points += 1;
      await user.save();
      await this.sendMessage(user.phoneNumber, "👍 Merci ! +1 point 🏆");
      return { success: true };
    }
    
    if (messageText.includes('👎')) {
      await this.sendMessage(user.phoneNumber, "👎 Désolé. Comment puis-je t'aider ?");
      return { success: true };
    }
    
    // Message générique
    await this.sendMessage(user.phoneNumber, 
      "Message reçu 👍\n\n" +
      "Tape *Aide* pour voir les commandes disponibles."
    );
    return { success: true };
  }

  /**
   * 🚨 SIGNALEMENT DANGER/INCIDENT
   */
  async handleDangerReport(user, messageText, mediaUrl) {
    try {
      // Créer l'incident en base
      const incident = await Incident.create({
        userId: user._id,
        type: 'danger',
        description: messageText,
        mediaUrl: mediaUrl || null,
        mediaType: mediaUrl ? (mediaUrl.includes('image') ? 'image' : 'audio') : 'none',
        severity: 'high',
        status: 'open',
        notified: false
      });
      
      // Envoyer confirmation à l'utilisateur
      await this.sendMessage(user.phoneNumber, 
        `🚨 Signalement enregistré !\n\n` +
        `Réf: #${incident._id.toString().slice(-6).toUpperCase()}\n\n` +
        `Superviseur alerté 🚑\n` +
        `Éloignez-vous de la zone si nécessaire.`
      );
      
      await this.logInteraction(user._id, 'incident', `Incident: ${incident._id}`);
      
      // ========== WEBHOOK VERS DASHBOARD ==========
      await this.notifyDashboard(incident, user);
      
      return { success: true };
    } catch (error) {
      logger.error('❌ Erreur handleDangerReport:', error);
      await this.sendMessage(user.phoneNumber, 
        "❌ Erreur lors de l'enregistrement. Réessayez."
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * 📡 NOTIFIER LE DASHBOARD VIA WEBHOOK
   */
  async notifyDashboard(incident, user) {
    try {
      const webhookUrl = process.env.DASHBOARD_WEBHOOK_URL;
      
      if (!webhookUrl) {
        logger.warn('⚠️ DASHBOARD_WEBHOOK_URL non configuré - incident non notifié au dashboard');
        return;
      }
      
      const payload = {
        phone: user.phoneNumber,
        incidentId: incident._id.toString(),
        type: incident.type,
        message: incident.description,
        mediaUrls: incident.mediaUrl ? [incident.mediaUrl] : [],
        timestamp: incident.reportedAt.toISOString(),
        severity: incident.severity,
        user: {
          name: user.name || 'Anonyme',
          profession: user.profession,
          language: user.language
        }
      };
      
      await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      // Marquer comme notifié
      incident.notified = true;
      await incident.save();
      
      logger.info(`✅ Incident ${incident._id} notifié au dashboard`);
    } catch (error) {
      logger.error('❌ Erreur notification dashboard:', error);
      // Ne pas bloquer le flux si le webhook échoue
    }
  }

  /**
   * 📋 CRÉER RÉCAPITULATIF PROFIL
   */
  createProfileSummary(user) {
    const modeText = user.preferredMode === 'audio' ? 'Audio 🎤' : 'Texte 📝';
    const professionText = user.profession || 'Non renseigné';
    const siteTypeText = user.chantierType || 'Non renseigné';
    const languageText = {
      'fr': 'Français',
      'fon': 'Fon',
      'yoruba': 'Yoruba'
    }[user.language] || user.language || 'Non renseigné';
    
    return `Mode: ${modeText}\n` +
           `Métier: ${professionText}\n` +
           `Type de chantier: ${siteTypeText}\n` +
           `Langue: ${languageText}`;
  }

  /**
   * 🆘 MESSAGE D'AIDE
   */
  async sendHelpMessage(user) {
    const message = `🆘 *Aide SHORA*\n\n` +
      `*Danger* - Signaler un risque ou incident\n` +
      `*Quiz* - Tester tes connaissances sécurité\n` +
      `*Profil* - Voir tes informations\n` +
      `*Aide* - Cette aide\n\n` +
      `Restez en sécurité ! 🦺`;
    
    if (user.preferredMode === 'audio') {
      try {
        const audioBuffer = await convertTextToAudio(message, user.language);
        await sendAudio(user.phoneNumber, audioBuffer);
      } catch (audioError) {
        await this.sendMessage(user.phoneNumber, message);
      }
    } else {
      await this.sendMessage(user.phoneNumber, message);
    }
    
    return { success: true };
  }

  /**
   * 🎯 ENVOYER QUIZ
   */
  async sendQuiz(user) {
    // TODO: Implémenter les quiz
    const message = `🎯 Quiz sécurité (bientôt disponible)\n\n` +
      `Les quiz arrivent prochainement ! 🚀`;
    
    await this.sendMessage(user.phoneNumber, message);
    return { success: true };
  }

  /**
   * 👤 ENVOYER PROFIL
   */
  async sendProfile(user) {
    const message = `👤 *Ton profil*\n\n` +
      `Nom: ${user.name || 'Non renseigné'}\n` +
      `Métier: ${user.profession || 'Non renseigné'}\n` +
      `Chantier: ${user.chantierType || 'Non renseigné'}\n` +
      `Langue: ${user.language || 'Non renseigné'}\n` +
      `Mode: ${user.preferredMode || 'Non renseigné'}\n` +
      `Points: ${user.points || 0} 🏆`;
    
    await this.sendMessage(user.phoneNumber, message);
    return { success: true };
  }

  /**
   * 📝 LOG INTERACTION
   */
  async logInteraction(userId, messageType, content) {
    try {
      await Interaction.create({
        userId,
        messageType,
        content: content || '',
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('❌ Erreur logInteraction:', error);
    }
  }
}

module.exports = BotService;
