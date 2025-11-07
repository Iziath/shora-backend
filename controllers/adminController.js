const User = require('../models/User');
const Incident = require('../models/Incident');
const Interaction = require('../models/Interaction');
const logger = require('../utils/logger');

/**
 * Vue d'ensemble du dashboard
 */
exports.getOverview = async (req, res) => {
  try {
    // Utilisateurs actifs
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Incidents ouverts
    const openIncidents = await Incident.countDocuments({ 
      status: { $in: ['open', 'in-progress'] } 
    });
    
    // Taux d'engagement (utilisateurs ayant interagi dans les 7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const engagedUsers = await User.countDocuments({
      isActive: true,
      lastInteraction: { $gte: sevenDaysAgo }
    });
    const engagementRate = activeUsers > 0 
      ? Math.round((engagedUsers / activeUsers) * 100) 
      : 0;
    
    // Score moyen des quiz (calcul simplifié basé sur les interactions)
    const quizInteractions = await Interaction.find({ 
      messageType: 'quiz',
      isCorrect: { $ne: null }
    });
    const avgQuizScore = quizInteractions.length > 0
      ? Math.round(
          (quizInteractions.filter(i => i.isCorrect).length / quizInteractions.length) * 100
        )
      : 0;
    
    // Nombre total de messages/interactions ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const totalMessages = await Interaction.countDocuments({
      timestamp: { $gte: startOfMonth }
    });
    
    res.json({
      success: true,
      data: {
        activeUsers,
        openIncidents,
        engagement: engagementRate,
        avgQuizScore,
        totalMessages
      }
    });
  } catch (error) {
    logger.error('Erreur getOverview:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Données d'engagement sur 30 jours
 */
exports.getEngagement = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Interactions par jour
    const interactions = await Interaction.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Utilisateurs actifs par jour
    const activeUsersByDay = await User.aggregate([
      { $match: { lastInteraction: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastInteraction' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Incidents par jour
    const incidentsByDay = await Incident.aggregate([
      { $match: { reportedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$reportedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        interactions,
        activeUsers: activeUsersByDay,
        incidents: incidentsByDay
      }
    });
  } catch (error) {
    logger.error('Erreur getEngagement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Répartition par profession
 */
exports.getProfessions = async (req, res) => {
  try {
    const professions = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$profession', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: professions
    });
  } catch (error) {
    logger.error('Erreur getProfessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

