const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  message: { type: String, required: true },
  subject: { type: String, default: '' },
  language: {
    type: String,
    enum: ['fr', 'fon', 'yoruba'],
    default: 'fr'
  },
  targetProfessions: [{ type: String }],
  targetLanguage: { type: String },
  sendAsAudio: { type: Boolean, default: false },
  scheduledTime: { type: Date, default: null }, // null = envoi immédiat
  scheduledSlot: {
    type: String,
    enum: ['7h', '12h-14h', '18h', null],
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'sending', 'completed', 'failed'],
    default: 'pending'
  },
  totalRecipients: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  sentAt: { type: Date, default: null },
  createdBy: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

// Index pour recherche rapide
broadcastSchema.index({ status: 1 });
broadcastSchema.index({ scheduledTime: 1 });
broadcastSchema.index({ scheduledSlot: 1 });
broadcastSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Broadcast', broadcastSchema);

