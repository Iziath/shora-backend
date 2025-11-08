const Incident = require('../models/Incident');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Récupère tous les incidents avec filtres
 */
exports.getAllIncidents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Filtres optionnels
    if (req.query.status) {
      // Support pour plusieurs statuts séparés par des virgules
      const statuses = req.query.status.split(',');
      if (statuses.length > 1) {
        filter.status = { $in: statuses };
      } else {
        filter.status = req.query.status;
      }
    }
    if (req.query.severity) {
      filter.severity = req.query.severity;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.reportedAt = {};
      if (req.query.startDate) {
        filter.reportedAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.reportedAt.$lte = new Date(req.query.endDate);
      }
    }
    
    const incidents = await Incident.find(filter)
      .populate('userId', 'name phoneNumber profession')
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
    const total = await Incident.countDocuments(filter);
    
    res.json({
      success: true,
      data: incidents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Erreur getAllIncidents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupère un incident par ID
 */
exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('userId', 'name phoneNumber profession language')
      .select('-__v');
    
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident non trouvé' });
    }
    
    res.json({ success: true, data: incident });
  } catch (error) {
    logger.error('Erreur getIncidentById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Met à jour un incident
 */
exports.updateIncident = async (req, res) => {
  try {
    const { status, severity, notes, resolvedBy } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident non trouvé' });
    }
    
    if (status) {
      incident.status = status;
      if (status === 'resolved' && !incident.resolvedAt) {
        incident.resolvedAt = new Date();
        incident.resolvedBy = resolvedBy || 'admin';
      }
    }
    if (severity) incident.severity = severity;
    if (notes !== undefined) incident.notes = notes;
    
    await incident.save();
    
    res.json({ success: true, data: incident });
  } catch (error) {
    logger.error('Erreur updateIncident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Supprime un incident
 */
exports.deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident non trouvé' });
    }
    
    res.json({ success: true, message: 'Incident supprimé' });
  } catch (error) {
    logger.error('Erreur deleteIncident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Crée un incident (route publique pour le chatbot)
 */
exports.createIncident = async (req, res) => {
  try {
    const { description, type, severity, location, reportedBy, chatbotUserId, chatbotUserName } = req.body;
    
    // Créer un incident avec userId optionnel (peut être null pour chatbot public)
    const incidentData = {
      description: description || 'Incident signalé via chatbot',
      type: type || 'danger',
      severity: severity || 'high',
      location: location || 'Chantier',
      status: 'open',
      reportedAt: new Date(),
      userId: null, // Par défaut null pour chatbot public
      chatbotUserId: chatbotUserId || null,
      chatbotUserName: chatbotUserName || null
    };
    
    // Si reportedBy est fourni (pour WhatsApp), essayer de trouver l'utilisateur
    if (reportedBy && reportedBy !== 'chatbot' && !chatbotUserId) {
      const user = await User.findOne({ phoneNumber: reportedBy });
      if (user) {
        incidentData.userId = user._id;
      }
    }
    
    const incident = new Incident(incidentData);
    await incident.save();
    
    logger.info(`✅ Incident créé depuis chatbot: ${incident._id}${chatbotUserName ? ` par ${chatbotUserName}` : ''}`);
    
    res.json({
      success: true,
      data: incident,
      message: 'Incident enregistré et signalé au superviseur'
    });
  } catch (error) {
    logger.error('Erreur createIncident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupère les statistiques des incidents
 */
exports.getIncidentStats = async (req, res) => {
  try {
    const total = await Incident.countDocuments();
    const open = await Incident.countDocuments({ status: 'open' });
    const inProgress = await Incident.countDocuments({ status: 'in-progress' });
    const resolved = await Incident.countDocuments({ status: 'resolved' });
    
    const byType = await Incident.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const bySeverity = await Incident.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Timeline des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const timeline = await Incident.aggregate([
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
        total,
        open,
        inProgress,
        resolved,
        byType,
        bySeverity,
        timeline
      }
    });
  } catch (error) {
    logger.error('Erreur getIncidentStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

