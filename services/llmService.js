// backend/services/llmService.js
/**
 * Service LLM pour le chatbot SHORA
 * Utilise Ollama (modèle local) ou peut être adapté pour d'autres LLM
 */

const axios = require('axios');
const logger = require('../utils/logger');

// Prompt système pour SHORA - spécialisé sécurité au travail
const SYSTEM_PROMPT = `Tu es SHORA, un assistant IA spécialisé en sécurité au travail pour les ouvriers sur chantier au Bénin.

Ton rôle :
- Répondre aux questions sur la sécurité au travail, les EPI (Équipements de Protection Individuelle), les risques professionnels
- Donner des conseils pratiques et adaptés au contexte béninois
- Utiliser un langage simple et accessible pour les ouvriers
- Être bienveillant, professionnel et encourageant
- Répondre en français, fon ou yoruba selon la langue de l'utilisateur

Contexte :
- Tu travailles avec des ouvriers (maçons, électriciens, plombiers, charpentiers, peintres, manœuvres)
- Les chantiers sont au Bénin (construction, rénovation, infrastructure)
- Tu dois promouvoir la culture de sécurité et prévenir les accidents

Réponds de manière concise, claire et actionnable. Utilise des emojis avec modération (🦺 ⚠️ ✅).`;

class LLMService {
    constructor() {
        this.systemPrompt = SYSTEM_PROMPT;
        // URL Ollama (modèle local) - peut être configuré via .env
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
        this.model = process.env.OLLAMA_MODEL || 'llama3.1';
        
        // Alternative : utiliser OpenAI, Anthropic, etc.
        this.useOllama = process.env.USE_OLLAMA !== 'false';
    }

    /**
     * Obtient une réponse du LLM
     */
    async getResponse(userInput) {
        logger.info(`🎤 Message utilisateur: ${userInput}`);
        
        if (this.useOllama) {
            return await this.getResponseOllama(userInput);
        } else {
            // TODO: Implémenter d'autres providers (OpenAI, Anthropic, etc.)
            return await this.getResponseOllama(userInput);
        }
    }

    /**
     * Obtient une réponse via Ollama (modèle local)
     */
    async getResponseOllama(userInput) {
        const prompt = `${this.systemPrompt}\n\nUtilisateur: ${userInput}\n\nSHORA:`;

        try {
            const response = await axios.post(this.ollamaUrl, {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9
                }
            }, {
                timeout: 30000 // 30 secondes timeout
            });

            const botReply = this.cleanResponse(response.data.response || '');
            
            if (!botReply || botReply.trim().length === 0) {
                logger.warn('Réponse vide du LLM');
                return 'Désolé, je n\'ai pas pu générer de réponse. Pouvez-vous reformuler votre question ?';
            }

            return botReply;

        } catch (error) {
            logger.error(`❌ Erreur Ollama: ${error.message}`);
            
            // Réponses de fallback si Ollama n'est pas disponible
            if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
                return this.getFallbackResponse(userInput);
            }
            
            return 'Désolé, une erreur est survenue avec le modèle IA. Veuillez réessayer.';
        }
    }

    /**
     * Nettoie la réponse du LLM
     */
    cleanResponse(rawResponse) {
        // Retirer les préfixes indésirables
        let cleaned = rawResponse
            .split('SHORA:').pop()
            .split('Assistant:').pop()
            .trim();
        
        // Retirer les marqueurs de fin de conversation
        cleaned = cleaned
            .replace(/\[FIN\]/gi, '')
            .replace(/\[END\]/gi, '')
            .trim();
        
        return cleaned;
    }

    /**
     * Réponses de fallback si le LLM n'est pas disponible
     */
    getFallbackResponse(userInput) {
        const lowerInput = userInput.toLowerCase();
        
        // Détection de mots-clés pour réponses simples
        if (lowerInput.includes('casque') || lowerInput.includes('protection tête')) {
            return 'Le casque de sécurité est obligatoire sur tous les chantiers. Il protège contre les chutes d\'objets et les chocs. Assurez-vous qu\'il soit bien ajusté et conforme aux normes. 🦺';
        }
        
        if (lowerInput.includes('gants') || lowerInput.includes('protection mains')) {
            return 'Les gants de protection sont essentiels selon votre métier : gants anti-coupure pour les manœuvres, gants isolants pour les électriciens, gants résistants aux produits chimiques pour les peintres. Choisissez-les adaptés à votre activité. 🧤';
        }
        
        if (lowerInput.includes('chaussures') || lowerInput.includes('bottes')) {
            return 'Les chaussures de sécurité doivent avoir des embouts renforcés et des semelles anti-perforation. Elles sont obligatoires sur tous les chantiers pour protéger vos pieds. 👷';
        }
        
        if (lowerInput.includes('danger') || lowerInput.includes('risque')) {
            return 'Si vous détectez un danger, éloignez-vous immédiatement de la zone et signalez-le à votre superviseur. Utilisez le mot-clé "Danger" dans WhatsApp SHORA pour un signalement rapide. ⚠️';
        }
        
        if (lowerInput.includes('accident') || lowerInput.includes('blessé')) {
            return 'En cas d\'accident, appelez les secours (117) et alertez immédiatement votre superviseur. Ne déplacez pas la victime sauf en cas de danger immédiat. 🚑';
        }
        
        // Réponse générique
        return 'Merci pour votre question. Je suis SHORA, votre assistant sécurité au travail. Pour des questions spécifiques, vous pouvez me demander :\n\n' +
               '• Les EPI obligatoires\n' +
               '• Les risques de votre métier\n' +
               '• Les bonnes pratiques de sécurité\n' +
               '• Comment signaler un danger\n\n' +
               'Pour un signalement urgent, utilisez le mot "Danger" dans WhatsApp SHORA. 🦺';
    }
}

module.exports = new LLMService();

