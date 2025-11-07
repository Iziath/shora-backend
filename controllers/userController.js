const User = require('../models/User');
const Interaction = require('../models/Interaction');
const logger = require('../utils/logger');

/**
 * Récupère tous les utilisateurs avec pagination
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Filtres optionnels
    if (req.query.profession) {
      // Support pour plusieurs professions séparées par des virgules
      const professions = Array.isArray(req.query.profession) 
        ? req.query.profession 
        : req.query.profession.split(',');
      if (professions.length > 1) {
        filter.profession = { $in: professions };
      } else {
        filter.profession = professions[0];
      }
    }
    if (req.query.language) {
      filter.language = req.query.language;
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    const users = await User.find(filter)
      .sort({ createdAt: -1, lastInteraction: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Erreur getAllUsers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupère un utilisateur par ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-__v');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Erreur getUserById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Met à jour un utilisateur
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, profession, language, preferredMode, isActive, medicalHistory } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    if (name) user.name = name;
    if (profession) user.profession = profession;
    if (language) user.language = language;
    if (preferredMode) user.preferredMode = preferredMode;
    if (isActive !== undefined) user.isActive = isActive;
    if (medicalHistory) {
      user.medicalHistory = {
        ...user.medicalHistory,
        ...medicalHistory
      };
    }
    
    await user.save();
    
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Erreur updateUser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Supprime un utilisateur
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    logger.error('Erreur deleteUser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupère les statistiques des utilisateurs
 */
exports.getUserStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ isActive: true });
    const inactive = total - active;
    
    const byProfession = await User.aggregate([
      { $group: { _id: '$profession', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const byLanguage = await User.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        byProfession,
        byLanguage
      }
    });
  } catch (error) {
    logger.error('Erreur getUserStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupère l'historique d'interactions d'un utilisateur
 */
exports.getUserInteractions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const interactions = await Interaction.find({ userId: req.params.id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
    const total = await Interaction.countDocuments({ userId: req.params.id });
    
    res.json({
      success: true,
      data: interactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Erreur getUserInteractions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Crée un nouvel utilisateur
 */
exports.createUser = async (req, res) => {
  try {
    const {
      phoneNumber,
      name,
      profession,
      language,
      preferredMode,
      medicalHistory
    } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec ce numéro de téléphone existe déjà'
      });
    }
    
    const user = new User({
      phoneNumber,
      name: name || '',
      profession: profession || 'autre',
      language: language || 'fr',
      preferredMode: preferredMode || 'text',
      medicalHistory: medicalHistory || {},
      conversationState: 'active',
      isActive: true
    });
    
    await user.save();
    
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Erreur createUser:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec ce numéro de téléphone existe déjà'
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Importe des utilisateurs depuis un fichier Excel/CSV
 */
exports.importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }
    
    const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Normaliser les noms de colonnes (insensible à la casse)
        const normalizeKey = (obj, key) => {
          const lowerKey = key.toLowerCase().trim();
          const keys = Object.keys(obj);
          const foundKey = keys.find(k => k.toLowerCase().trim() === lowerKey);
          return foundKey ? obj[foundKey] : null;
        };
        
        const phoneNumber = normalizeKey(row, 'phoneNumber') || normalizeKey(row, 'téléphone') || normalizeKey(row, 'phone');
        const name = normalizeKey(row, 'name') || normalizeKey(row, 'nom') || '';
        const profession = normalizeKey(row, 'profession') || 'autre';
        const language = normalizeKey(row, 'language') || normalizeKey(row, 'langue') || 'fr';
        
        if (!phoneNumber) {
          results.failed++;
          results.errors.push(`Ligne ${i + 2}: Numéro de téléphone manquant`);
          continue;
        }
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ phoneNumber: String(phoneNumber).trim() });
        if (existingUser) {
          results.failed++;
          results.errors.push(`Ligne ${i + 2}: Utilisateur ${phoneNumber} existe déjà`);
          continue;
        }
        
        // Extraire les antécédents médicaux
        const medicalHistory = {
          allergies: normalizeKey(row, 'allergies') || normalizeKey(row, 'allergie') || '',
          chronicDiseases: normalizeKey(row, 'chronicDiseases') || normalizeKey(row, 'maladie chronique') || normalizeKey(row, 'maladies') || '',
          medications: normalizeKey(row, 'medications') || normalizeKey(row, 'médicaments') || '',
          bloodType: normalizeKey(row, 'bloodType') || normalizeKey(row, 'groupe sanguin') || '',
          emergencyContact: {
            name: normalizeKey(row, 'emergencyContactName') || normalizeKey(row, 'contact urgence nom') || '',
            phone: normalizeKey(row, 'emergencyContactPhone') || normalizeKey(row, 'contact urgence téléphone') || '',
            relationship: normalizeKey(row, 'emergencyContactRelationship') || normalizeKey(row, 'contact urgence lien') || ''
          },
          notes: normalizeKey(row, 'medicalNotes') || normalizeKey(row, 'notes médicales') || ''
        };
        
        const user = new User({
          phoneNumber: String(phoneNumber).trim(),
          name: String(name).trim(),
          profession: profession || 'autre',
          language: language || 'fr',
          preferredMode: 'text',
          medicalHistory,
          conversationState: 'active',
          isActive: true
        });
        
        await user.save();
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Ligne ${i + 2}: ${error.message}`);
      }
    }
    
    res.json({
      success: true,
      data: {
        total: data.length,
        imported: results.success,
        failed: results.failed,
        errors: results.errors
      }
    });
  } catch (error) {
    logger.error('Erreur importUsers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

