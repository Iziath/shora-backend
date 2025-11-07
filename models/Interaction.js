const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  messageType: {
    type: String,
    enum: ['tip', 'quiz', 'alert', 'response', 'incident', 'other'],
    required: true
  },
  content: { type: String, required: true },
  userResponse: { type: String, default: null },
  isCorrect: { type: Boolean, default: null },  // Pour quiz
  pointsEarned: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

// Index pour analytics
interactionSchema.index({ userId: 1, timestamp: -1 });
interactionSchema.index({ messageType: 1 });
interactionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);

