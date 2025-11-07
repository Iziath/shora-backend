const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const incidentController = require('../controllers/incidentController');
const broadcastController = require('../controllers/broadcastController');

// Configuration multer pour l'upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez Excel (.xlsx, .xls) ou CSV (.csv)'));
    }
  }
});

// Toutes les routes admin nécessitent une authentification
router.use(authenticate);

// Dashboard
router.get('/overview', adminController.getOverview);
router.get('/engagement', adminController.getEngagement);
router.get('/professions', adminController.getProfessions);

// Users
router.get('/users', userController.getAllUsers);
router.get('/users/stats', userController.getUserStats);
router.post('/users', userController.createUser);
router.post('/users/import', upload.single('file'), userController.importUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.get('/users/:id/interactions', userController.getUserInteractions);

// Incidents
router.get('/incidents', incidentController.getAllIncidents);
router.get('/incidents/stats', incidentController.getIncidentStats);
router.get('/incidents/:id', incidentController.getIncidentById);
router.put('/incidents/:id', incidentController.updateIncident);
router.delete('/incidents/:id', incidentController.deleteIncident);

// Broadcast
router.post('/broadcast', broadcastController.sendBroadcast);
router.get('/broadcast/history', broadcastController.getBroadcastHistory);

module.exports = router;

