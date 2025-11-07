// backend/whatsapp/client.js
const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

let sock = null;
let qrCodeData = null;
let connectedAt = null; // Date de connexion

/**
 * 🚀 CONNEXION WHATSAPP PRINCIPALE
 */
async function connectWhatsApp(messageHandler) {
  try {
    // Dossier de session WhatsApp
    const sessionPath = path.join(__dirname, 'session');
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    // Chargement de l'état d'authentification
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    // Version Baileys
    const { version } = await fetchLatestBaileysVersion();

    // Création du socket WhatsApp
    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
      },
      printQRInTerminal: false,  // Ne pas afficher QR dans terminal
      logger: pino({ level: 'silent' }),
      browser: ['Shora Bot', 'Chrome', '1.0.0'],  // Nom visible dans WhatsApp
      defaultQueryTimeoutMs: undefined,
      keepAliveIntervalMs: 30000
    });

    // ========== GESTION QR CODE ==========
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Stocker le QR Code (pour le dashboard, pas d'affichage terminal)
      if (qr) {
        qrCodeData = qr;
        console.log('📱 QR Code généré (disponible dans le dashboard)');
      }

      // Connexion établie
      if (connection === 'open') {
        console.log('✅ BOT SHORA CONNECTÉ À WHATSAPP !');
        console.log(`📱 Numéro: ${sock.user.id.split(':')[0]}`);
        
        qrCodeData = null;
        connectedAt = new Date(); // Enregistrer la date de connexion

        // ========== CONFIGURATION PROFIL SHORA ==========
        await updateProfileInfo(sock);
      }

      // Déconnexion
      if (connection === 'close') {
        const shouldReconnect = 
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log(
          '❌ Connexion fermée:', 
          lastDisconnect?.error, 
          '\n🔄 Reconnexion:', 
          shouldReconnect
        );

        if (shouldReconnect) {
          setTimeout(() => connectWhatsApp(messageHandler), 3000);
        } else {
          console.log('⚠️ Déconnecté. Relance le serveur et scanne le QR.');
        }
      }
    });

    // Sauvegarder les credentials
    sock.ev.on('creds.update', saveCreds);

    // ========== RÉCEPTION DES MESSAGES ==========
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const message of messages) {
        // Ignorer messages du bot lui-même
        if (message.key.fromMe) continue;

        // Ignorer messages de statut
        if (message.key.remoteJid === 'status@broadcast') continue;

        const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
        
        // Extraire le contenu du message
        let messageText = '';
        let messageType = 'text';
        let mediaUrl = null;

        if (message.message?.conversation) {
          messageText = message.message.conversation;
        } else if (message.message?.extendedTextMessage) {
          messageText = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage) {
          messageType = 'image';
          messageText = message.message.imageMessage.caption || '';
          // TODO: Télécharger l'image si nécessaire
        } else if (message.message?.audioMessage) {
          messageType = 'audio';
          // TODO: Télécharger l'audio si nécessaire
        }

        console.log(`\n📩 Message reçu:`);
        console.log(`   De: +${phoneNumber}`);
        console.log(`   Type: ${messageType}`);
        console.log(`   Contenu: ${messageText}`);

        // ========== APPELER LE HANDLER (botService) ==========
        if (messageHandler && messageText.trim()) {
          await messageHandler(phoneNumber, messageText, messageType, mediaUrl);
        }
      }
    });

    return sock;

  } catch (error) {
    console.error('❌ Erreur connexion WhatsApp:', error);
    throw error;
  }
}

/**
 * 🎨 METTRE À JOUR LE PROFIL SHORA
 */
async function updateProfileInfo(socket) {
  try {
    // Changer le nom du profil
    await socket.updateProfileName('Shora 🦺');
    console.log('✅ Nom du profil mis à jour: Shora 🦺');

    // Changer le statut
    await socket.updateProfileStatus(
      '🦺 Assistant sécurité chantier\n' +
      '⚠️ Signalement dangers\n' +
      '💡 Conseils quotidiens\n' +
      '📍 Disponible 24/7'
    );
    console.log('✅ Statut mis à jour');

    // ========== CHANGER LA PHOTO DE PROFIL ==========
    const profilePicPath = path.join(__dirname, '../assets/shora-logo.jpg');
    
    if (fs.existsSync(profilePicPath)) {
      const profilePic = fs.readFileSync(profilePicPath);
      await socket.updateProfilePicture(socket.user.id, profilePic);
      console.log('✅ Photo de profil mise à jour');
    } else {
      console.log('⚠️ Photo de profil non trouvée:', profilePicPath);
      console.log('   Créez le fichier: backend/assets/shora-logo.jpg');
    }

  } catch (error) {
    console.error('⚠️ Erreur mise à jour profil:', error.message);
  }
}

/**
 * 📤 ENVOYER UN MESSAGE
 */
async function sendMessage(phoneNumber, message, options = {}) {
  if (!sock) {
    throw new Error('Socket WhatsApp non initialisé');
  }

  try {
    const jid = phoneNumber.includes('@') 
      ? phoneNumber 
      : `${phoneNumber}@s.whatsapp.net`;

    await sock.sendMessage(jid, { 
      text: message,
      ...options
    });

    console.log(`✅ Message envoyé à ${phoneNumber}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Erreur envoi message à ${phoneNumber}:`, error);
    throw error;
  }
}

/**
 * 📷 ENVOYER UNE IMAGE
 */
async function sendImage(phoneNumber, imageBuffer, caption = '') {
  if (!sock) {
    throw new Error('Socket WhatsApp non initialisé');
  }

  try {
    const jid = `${phoneNumber}@s.whatsapp.net`;

    await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: caption
    });

    console.log(`✅ Image envoyée à ${phoneNumber}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Erreur envoi image à ${phoneNumber}:`, error);
    throw error;
  }
}

/**
 * 🎤 ENVOYER UN AUDIO
 */
async function sendAudio(phoneNumber, audioBuffer) {
  if (!sock) {
    throw new Error('Socket WhatsApp non initialisé');
  }

  try {
    const jid = `${phoneNumber}@s.whatsapp.net`;

    await sock.sendMessage(jid, {
      audio: audioBuffer,
      mimetype: 'audio/mp4',
      ptt: true  // Push-to-talk (message vocal)
    });

    console.log(`✅ Audio envoyé à ${phoneNumber}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Erreur envoi audio à ${phoneNumber}:`, error);
    throw error;
  }
}

/**
 * 📄 ENVOYER UN DOCUMENT
 */
async function sendDocument(phoneNumber, documentBuffer, filename, mimetype) {
  if (!sock) {
    throw new Error('Socket WhatsApp non initialisé');
  }

  try {
    const jid = `${phoneNumber}@s.whatsapp.net`;

    await sock.sendMessage(jid, {
      document: documentBuffer,
      fileName: filename,
      mimetype: mimetype
    });

    console.log(`✅ Document envoyé à ${phoneNumber}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Erreur envoi document à ${phoneNumber}:`, error);
    throw error;
  }
}

/**
 * ✅ MARQUER COMME LU
 */
async function markAsRead(phoneNumber, messageId) {
  if (!sock) return;

  try {
    const jid = `${phoneNumber}@s.whatsapp.net`;
    await sock.readMessages([{ remoteJid: jid, id: messageId }]);
  } catch (error) {
    console.error('Erreur marquage lu:', error);
  }
}

/**
 * 🔄 OBTENIR LE QR CODE (pour dashboard)
 */
function getQRCode() {
  return qrCodeData;
}

/**
 * 📊 STATUT DE LA CONNEXION
 */
function getConnectionStatus() {
  let phoneNumber = null;
  
  if (sock && sock.user && sock.user.id) {
    const jid = sock.user.id;
    const numberMatch = jid.match(/^(\d+)@/);
    if (numberMatch) {
      phoneNumber = numberMatch[1];
    }
  }
  
  return {
    connected: sock?.user ? true : false,
    phoneNumber: phoneNumber,
    name: sock?.user?.name || 'SHORA'
  };
}

/**
 * Vérifie si WhatsApp est connecté
 */
function isConnected() {
  return sock?.user ? true : false;
}

/**
 * Récupère le socket WhatsApp
 */
function getSocket() {
  return sock;
}

/**
 * Récupère la date de connexion
 */
function getConnectedAt() {
  return connectedAt;
}

module.exports = {
  connectWhatsApp,
  sendMessage,
  sendImage,
  sendAudio,
  sendDocument,
  markAsRead,
  getQRCode,
  getConnectionStatus,
  isConnected,
  getSocket,
  getConnectedAt
};