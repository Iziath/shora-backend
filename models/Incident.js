const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false, // Optionnel pour permettre les incidents depuis le chatbot public
    default: null
  },
  chatbotUserId: {
    type: String, // ID de l'utilisateur chatbot (référence vers ChatbotUser dans Quran_back)
    default: null
  },
  chatbotUserName: {
    type: String, // Nom de l'utilisateur chatbot qui a signalé l'incident
    default: null
  },
  type: {
    type: String,
    enum: ['danger', 'accident', 'near-miss', 'equipment'],
    default: 'danger'
  },
  description: { type: String, required: true },
  mediaUrl: { type: String, default: null },  // Cloudinary URL
  mediaType: {
    type: String,
    enum: ['audio', 'image', 'none'],
    default: 'none'
  },
  location: { type: String, default: '' },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'false-alarm'],
    default: 'open'
  },
  resolvedBy: { type: String, default: null },
  resolvedAt: { type: Date, default: null },
  notes: { type: String, default: '' },
  reportedAt: { type: Date, default: Date.now }
});

// Index pour recherche et filtrage
incidentSchema.index({ userId: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ reportedAt: -1 });
incidentSchema.index({ status: 1, severity: 1 });

module.exports = mongoose.model('Incident', incidentSchema);

