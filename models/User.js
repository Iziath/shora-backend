const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: false, // Optionnel pour les utilisateurs chatbot
    unique: true,
    sparse: true, // Permet plusieurs null
    match: /^\+229\d{8}$/  // Format béninois
  },
  // Champs pour les utilisateurs chatbot (sans numéro de téléphone)
  isChatbotUser: {
    type: Boolean,
    default: false // true = utilisateur chatbot, false = utilisateur WhatsApp
  },
  hasVisitedBefore: {
    type: Boolean,
    default: false
  },
  lastVisitAt: {
    type: Date,
    default: Date.now
  },
  name: { type: String, default: '' },
  profession: {
    type: String,
    enum: ['maçon', 'électricien', 'plombier', 'charpentier', 'peintre', 'manœuvre', 'autre'],
    default: 'autre'
  },
  chantierType: {
    type: String,
    enum: ['construction', 'rénovation', 'infrastructure', 'autre'],
    default: 'autre'
  },
  language: {
    type: String,
    enum: ['fr', 'fon', 'yoruba'],
    default: 'fr'
  },
  preferredMode: {
    type: String,
    enum: ['text', 'audio'],
    default: 'text'
  },
  status: {
    type: Boolean,
    default: false  // false = profil non validé, true = profil validé et actif
  },
  conversationState: {
    type: String,
    enum: ['new', 'onboarding', 'active', 'inactive'],
    default: 'new'
  },
  onboardingStep: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }, // Pour compatibilité avec code existant
  hasScannedQR: { type: Boolean, default: false }, // Indique si l'utilisateur a scanné le QR code
  lastInteraction: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  // Antécédents médicaux
  medicalHistory: {
    allergies: { type: String, default: '' },
    chronicDiseases: { type: String, default: '' },
    medications: { type: String, default: '' },
    bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], default: '' },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' }
    },
    notes: { type: String, default: '' }
  }
});

// Index pour recherche rapide
userSchema.index({ phoneNumber: 1 });
userSchema.index({ name: 1 }); // Pour recherche par nom (chatbot users)
userSchema.index({ profession: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastInteraction: -1 });
userSchema.index({ isChatbotUser: 1, lastVisitAt: -1 }); // Pour les rappels

module.exports = mongoose.model('User', userSchema);

