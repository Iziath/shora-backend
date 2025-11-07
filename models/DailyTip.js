const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: {
    fr: { type: String, required: true },
    fon: { type: String, default: '' },
    yoruba: { type: String, default: '' }
  },
  category: {
    type: String,
    enum: ['général', 'électricité', 'hauteur', 'manutention', 'équipement'],
    required: true
  },
  professions: [{ type: String }],  // ['maçon', 'électricien'] ou [] pour tous
  mediaUrl: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Index
tipSchema.index({ category: 1 });
tipSchema.index({ isActive: 1 });
tipSchema.index({ professions: 1 });

module.exports = mongoose.model('DailyTip', tipSchema);

