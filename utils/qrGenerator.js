const QRCode = require('qrcode');
const logger = require('../utils/logger');

/**
 * Génère un QR code et retourne l'URL de l'image
 */
async function generateQRCode(data) {
  try {
    // Générer le QR code en base64
    const qrDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1
    });
    
    return qrDataUrl;
  } catch (error) {
    logger.error('Erreur génération QR code:', error);
    throw error;
  }
}

/**
 * Génère un QR code et le sauvegarde dans un fichier
 */
async function generateQRCodeFile(data, filePath) {
  try {
    await QRCode.toFile(filePath, data, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 1
    });
    
    logger.info(`QR code sauvegardé: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error('Erreur génération QR code fichier:', error);
    throw error;
  }
}

module.exports = {
  generateQRCode,
  generateQRCodeFile
};

