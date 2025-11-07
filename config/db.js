const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB connecté: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Erreur MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Gestion des événements de connexion
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connecté à MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Erreur Mongoose: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose déconnecté de MongoDB');
});

module.exports = connectDB;

