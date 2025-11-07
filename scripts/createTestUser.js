require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Script pour créer un utilisateur test
 */
async function createTestUser() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('✅ Connecté à MongoDB');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ phoneNumber: '+22912345678' });
    
    if (existingUser) {
      logger.info('ℹ️  Utilisateur test existe déjà');
      logger.info(`   Nom: ${existingUser.name || 'Non défini'}`);
      logger.info(`   Téléphone: ${existingUser.phoneNumber}`);
      logger.info(`   Profession: ${existingUser.profession}`);
      logger.info(`   État: ${existingUser.conversationState}`);
      await mongoose.connection.close();
      return;
    }

    // Créer l'utilisateur test
    const testUser = new User({
      phoneNumber: '+22912345678',
      name: 'Ouvrier Test',
      profession: 'maçon',
      chantierType: 'construction',
      language: 'fr',
      preferredMode: 'text',
      conversationState: 'active',
      points: 100,
      isActive: true,
      lastInteraction: new Date()
    });

    await testUser.save();

    logger.info('✅ Utilisateur test créé avec succès !');
    logger.info('   📱 Téléphone: +22912345678');
    logger.info('   👤 Nom: Ouvrier Test');
    logger.info('   🔧 Profession: maçon');
    logger.info('   🌍 Langue: français');
    logger.info('   ⭐ Points: 100');
    logger.info('   ✅ État: actif');

    await mongoose.connection.close();
    logger.info('✅ Connexion MongoDB fermée');
    
  } catch (error) {
    logger.error('❌ Erreur lors de la création de l\'utilisateur test:', error);
    process.exit(1);
  }
}

// Exécuter le script
createTestUser();

