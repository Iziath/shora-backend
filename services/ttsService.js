// backend/services/ttsService.js
/**
 * Service TTS (Text-to-Speech) pour le chatbot SHORA
 * Génère des fichiers audio à partir de texte
 */

const gtts = require('gtts');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class TTSService {
    constructor(outputDir = 'audio_responses') {
        this.outputDir = path.join(__dirname, '..', outputDir);
        
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
            logger.info(`📁 Dossier audio créé: ${this.outputDir}`);
        }
    }

    /**
     * Génère un fichier audio à partir d'un texte
     * @param {string} text - Texte à convertir
     * @param {string} filename - Nom du fichier de sortie
     * @param {string} language - Langue (fr, fon, yoruba)
     * @returns {Promise<string>} Chemin du fichier audio généré
     */
    async generateAudio(text, filename, language = 'fr') {
        const processedText = this.cleanText(text);
        const fullPath = path.join(this.outputDir, filename);

        return new Promise((resolve, reject) => {
            try {
                // Mapping des langues pour gTTS
                const langMap = {
                    'fr': 'fr',
                    'fon': 'fr', // gTTS ne supporte pas le Fon, on utilise le français
                    'yoruba': 'yo'
                };
                
                const gttsLang = langMap[language] || 'fr';
                
                // Utiliser la même syntaxe que audioService.js
                const tts = new gtts(processedText, gttsLang);
                
                tts.save(fullPath, (err) => {
                    if (err) {
                        logger.error(`❌ Erreur génération audio: ${err.message}`);
                        return reject(err);
                    }
                    
                    logger.info(`✅ Audio généré: ${filename}`);
                    resolve(fullPath);
                });
            } catch (error) {
                logger.error(`❌ Erreur TTS: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * Nettoie le texte pour une meilleure synthèse vocale
     */
    cleanText(text) {
        // Retirer les markdown et caractères spéciaux
        text = text.replace(/\*/g, '');
        text = text.replace(/\n+/g, '. ');
        text = text.replace(/(\s*-\s*|\s*\*\s*)/g, ', ');
        text = text.replace(/: /g, ', ');
        text = text.replace(/; /g, '. ');
        text = text.replace(/[?!]/g, '.');
        text = text.replace(/[»«'"]/g, '');
        
        // Améliorer la ponctuation pour la lecture
        text = text.replace(/\s+(et|ou|donc)\s+/g, ' $1 ');
        text = text.replace(/\b(afin de|pour|en)\b/g, '$0,');

        // Diviser les phrases trop longues
        let phrases = [];
        for (let phrase of text.split('. ')) {
            phrase = phrase.trim();
            if (phrase.split(' ').length > 15) {
                phrases.push(...this.splitFrenchSentence(phrase));
            } else {
                phrases.push(phrase);
            }
        }
        
        text = phrases.join('. ');
        text = text.split(' ').filter(Boolean).join(' ');
        
        if (!text.endsWith('.')) {
            text += '.';
        }
        
        return text;
    }

    /**
     * Divise une phrase française trop longue
     */
    splitFrenchSentence(sentence) {
        const splitPoints = [
            /\s+mais\s+/,
            /\s+car\s+/,
            /\s+donc\s+/,
            /\s+cependant\s+/,
            /,\s+(qui|que|dont)\s+/
        ];
        
        for (const pattern of splitPoints) {
            sentence = sentence.replace(pattern, (match) => `. ${match.trim()} `);
        }
        
        return sentence.split('. ').filter(s => s.trim());
    }
}

module.exports = new TTSService();

