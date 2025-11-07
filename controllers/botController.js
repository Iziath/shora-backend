// backend/controllers/botController.js
/**
 * Contrôleur pour le chatbot SHORA
 * Gère les interactions avec le chatbot IA du dashboard
 */

const ChatBot = require('../models/ChatBot');
const llmService = require('../services/llmService');
const ttsService = require('../services/ttsService');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * POST /api/bot/chat
 * Envoie un message au chatbot et récupère la réponse
 */
exports.chat = async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Le message ne peut pas être vide'
            });
        }

        logger.info(`💬 Chat SHORA - Message reçu: ${text}`);

        // Obtenir la réponse du LLM
        const botReply = await llmService.getResponse(text);
        
        if (!botReply) {
            return res.status(500).json({
                success: false,
                error: 'Erreur de génération de réponse.'
            });
        }

        logger.info(`🤖 Chat SHORA - Réponse: ${botReply.substring(0, 100)}...`);

        // Sauvegarder l'interaction en base (optionnel)
        try {
            const chatMessage = new ChatBot({
                text_user: text,
                text_bot: botReply,
                userId: req.user?.id || null,
                timestamp: new Date()
            });
            await chatMessage.save();
        } catch (saveError) {
            logger.warn('Erreur sauvegarde chat:', saveError);
            // Ne pas bloquer la réponse si la sauvegarde échoue
        }

        // Retourner la réponse
        res.json({
            success: true,
            text_user: text,
            text_bot: botReply
        });

    } catch (error) {
        logger.error('❌ Erreur chat SHORA:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur.'
        });
    }
};

/**
 * GET /api/bot/audio/:filename
 * Récupère un fichier audio généré (optionnel)
 */
exports.getAudio = async (req, res) => {
    try {
        const filename = req.params.filename;
        const audioPath = path.join(__dirname, '../audio_responses', filename);

        if (fs.existsSync(audioPath)) {
            res.sendFile(audioPath);
        } else {
            res.status(404).json({
                success: false,
                error: 'Fichier audio non trouvé.'
            });
        }
    } catch (error) {
        logger.error('❌ Erreur récupération audio:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du fichier audio.'
        });
    }
};

