const mongoose = require('mongoose');

const medicalSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    default: 'unknown'
  },
  allergies: [{ type: String }],  // Ex: ['pénicilline', 'arachides']
  chronicConditions: [{ type: String }],  // Ex: ['diabète', 'hypertension']
  medications: [{ type: String }],
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relation: { type: String, default: 'famille' }
  },
  qrCode: { type: String, unique: true },  // ID unique pour URL
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index
medicalSchema.index({ userId: 1 });
medicalSchema.index({ qrCode: 1 });

// Middleware pour mettre à jour updatedAt
medicalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MedicalProfile', medicalSchema);

