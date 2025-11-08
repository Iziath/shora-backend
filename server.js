require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');

// Import routes
const adminRoutes = require('./routes/admin');
const qrRoutes = require('./routes/qr');
const authRoutes = require('./routes/auth');
const whatsappRoutes = require('./routes/whatsapp');
const scanRoutes = require('./routes/scan');
const botRoutes = require('./routes/bot');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import database
const connectDB = require('./config/db');

// Import WhatsApp client
const { connectWhatsApp } = require('./whatsapp/client');
const { handleIncomingMessage } = require('./whatsapp/handler');

// Import Schedulers
const { initializeSchedulers } = require('./services/schedulerService');

// ========== INITIALISATION APP ==========
const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARES ==========
// Sécurité avec helmet (si disponible)
try {
  const helmet = require('helmet');
  app.use(helmet());
} catch (e) {
  logger.warn('helmet non installé, installation recommandée: npm install helmet');
}

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    // En production, autoriser uniquement le frontend
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.DASHBOARD_URL
    ].filter(Boolean); // Enlève les valeurs null/undefined
    
    // En développement, autoriser toutes les origines
    if (process.env.NODE_ENV === 'development' || allowedOrigins.length === 0) {
      return callback(null, true);
    }
    
    // En production, vérifier l'origine
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging avec morgan (si disponible)
try {
  const morgan = require('morgan');
  app.use(morgan('dev'));
} catch (e) {
  // Fallback sur le logger personnalisé
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
}

// ========== ROUTES API ==========
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/scan', scanRoutes); // Redirection QR → WhatsApp
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/bot', botRoutes); // Chatbot SHORA

// Route publique pour créer des incidents depuis le chatbot
const incidentController = require('./controllers/incidentController');
app.post('/api/incidents', incidentController.createIncident);

// ========== WEBHOOK POUR INCIDENTS (Dashboard) ==========
app.post('/api/webhook/incident', async (req, res) => {
  try {
    const { phone, incidentId, type, message, mediaUrls, timestamp, severity, user } = req.body;
    
    logger.info('📡 Webhook incident reçu:', { phone, incidentId, type });
    
    // TODO: Traiter l'incident reçu du bot (si nécessaire)
    // Le bot envoie déjà les incidents au dashboard via DASHBOARD_WEBHOOK_URL
    
    res.json({
      success: true,
      message: 'Incident reçu',
      incidentId
    });
  } catch (error) {
    logger.error('❌ Erreur webhook incident:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== ROUTE DE SANTÉ ==========
app.get('/api/health', (req, res) => {
  const { isConnected } = require('./whatsapp/client');
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    whatsapp: {
      connected: isConnected()
    },
    database: 'connected'
  });
});

// Route health legacy (pour compatibilité)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== ROUTE 404 ==========
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// ========== GESTION D'ERREURS ==========
app.use((err, req, res, next) => {
  logger.error('❌ Erreur serveur:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Utiliser aussi le errorHandler existant
app.use(errorHandler);

// ========== DÉMARRAGE DU SERVEUR ==========
async function startServer() {
  try {
    logger.info('\n🚀 ========== DÉMARRAGE SHORA BOT ==========\n');

    // 1. Connexion Base de données
    logger.info('🗄️  Connexion à MongoDB...');
    await connectDB();
    logger.info('✅ MongoDB connecté\n');

    // 2. Connexion WhatsApp
    logger.info('📱 Connexion à WhatsApp...');
    await connectWhatsApp(handleIncomingMessage);
    logger.info('✅ WhatsApp connecté\n');

    // 3. Démarrer le scheduler (messages quotidiens)
    logger.info('⏰ Démarrage du scheduler...');
    initializeSchedulers();
    logger.info('✅ Scheduler actif\n');

    // 4. Démarrer Express
    // Écouter sur toutes les interfaces (0.0.0.0) pour permettre l'accès via IP locale
    app.listen(PORT, '0.0.0.0', () => {
      const os = require('os');
      const interfaces = os.networkInterfaces();
      let localIP = 'localhost';
      
      // Détecter l'IP locale
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            localIP = iface.address;
            break;
          }
        }
        if (localIP !== 'localhost') break;
      }
      
      logger.info(`✅ Serveur Express démarré sur le port ${PORT}`);
      logger.info(`📡 API: http://localhost:${PORT}/api`);
      logger.info(`🌐 API (IP locale): http://${localIP}:${PORT}/api`);
      logger.info(`🏥 Health: http://localhost:${PORT}/api/health`);
      logger.info(`📱 Environnement: ${process.env.NODE_ENV || 'development'}\n`);
      logger.info('🦺 ========== SHORA BOT PRÊT ! ==========\n');
    });

  } catch (error) {
    logger.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
}

// ========== GESTION ARRÊT GRACIEUX ==========
process.on('SIGINT', async () => {
  logger.info('\n⚠️  Arrêt du serveur...');
  const mongoose = require('mongoose');
  mongoose.connection.close(() => {
    logger.info('Connexion MongoDB fermée');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  logger.info('\n⚠️  Arrêt du serveur...');
  const mongoose = require('mongoose');
  mongoose.connection.close(() => {
    logger.info('Connexion MongoDB fermée');
    process.exit(0);
  });
});

// ========== LANCEMENT ==========
startServer();

module.exports = app;

