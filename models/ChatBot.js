// backend/models/ChatBot.js
/**
 * Modèle pour stocker les interactions du chatbot SHORA
 */

const mongoose = require('mongoose');

const chatBotSchema = new mongoose.Schema({
    text_user: {
        type: String,
        required: true
    },
    text_bot: {
        type: String,
        required: true
    },
    audio_bot: {
        type: String,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index pour recherche rapide
chatBotSchema.index({ userId: 1, timestamp: -1 });
chatBotSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ChatBot', chatBotSchema);

