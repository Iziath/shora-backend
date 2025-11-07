const gtts = require('gtts');
const logger = require('../utils/logger');

/**
 * Convertit un texte en audio (MP3 buffer)
 */
async function convertTextToAudio(text, language = 'fr') {
  return new Promise((resolve, reject) => {
    try {
      if (!text || text.trim().length === 0) {
        logger.warn('Tentative de conversion texte vide en audio');
        reject(new Error('Texte vide'));
        return;
      }
      
      // Mapping des langues pour gTTS
      const langMap = {
        'fr': 'fr',
        'fon': 'fr', // gTTS ne supporte pas le Fon, on utilise le français
        'yoruba': 'yo'
      };
      
      const gttsLang = langMap[language] || 'fr';
      
      logger.info(`🎵 Conversion texte->audio (${gttsLang}): "${text.substring(0, 50)}..."`);
      
      const tts = new gtts(text, gttsLang);
      const chunks = [];
      let hasError = false;
      
      tts.stream()
        .on('data', (chunk) => {
          if (!hasError) {
            chunks.push(chunk);
          }
        })
        .on('end', () => {
          if (hasError) {
            return;
          }
          
          if (chunks.length === 0) {
            logger.error('Aucune donnée audio générée');
            reject(new Error('Aucune donnée audio générée'));
            return;
          }
          
          const buffer = Buffer.concat(chunks);
          logger.info(`✅ Audio généré: ${buffer.length} bytes`);
          resolve(buffer);
        })
        .on('error', (error) => {
          hasError = true;
          logger.error('Erreur conversion texte->audio:', error);
          reject(error);
        });
    } catch (error) {
      logger.error('Erreur création gTTS:', error);
      reject(error);
    }
  });
}

/**
 * Génère un fichier audio temporaire (pour tests)
 */
async function generateAudioFile(text, language, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const langMap = {
        'fr': 'fr',
        'fon': 'fr',
        'yoruba': 'yo'
      };
      
      const gttsLang = langMap[language] || 'fr';
      const tts = new gtts(text, gttsLang);
      
      tts.save(outputPath, (error) => {
        if (error) {
          logger.error('Erreur sauvegarde audio:', error);
          reject(error);
        } else {
          logger.info(`Audio sauvegardé: ${outputPath}`);
          resolve(outputPath);
        }
      });
    } catch (error) {
      logger.error('Erreur génération audio:', error);
      reject(error);
    }
  });
}

module.exports = {
  convertTextToAudio,
  generateAudioFile
};

