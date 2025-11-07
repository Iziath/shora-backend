# 🤖 SHORA-BOT Backend

Backend complet pour **SHORA-BOT** - Chatbot WhatsApp de sécurité au travail pour les ouvriers sur chantier.

## 📋 Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Architecture](#architecture)
- [Scénario conversationnel](#scénario-conversationnel)
- [Tests manuels](#tests-manuels)
- [Dépannage](#dépannage)

## 🎯 Présentation

SHORA-BOT est un chatbot WhatsApp intelligent qui permet aux ouvriers de :
- ✅ S'inscrire via QR code
- ✅ Recevoir des conseils quotidiens de sécurité
- ✅ Signaler des incidents en temps réel
- ✅ Tester leurs connaissances via des quiz
- ✅ Recevoir des alertes personnalisées

Le backend utilise **Baileys** pour la connexion WhatsApp, **MongoDB** pour le stockage, et **Express** pour l'API REST.

## ✨ Fonctionnalités

### 🔄 Connexion WhatsApp
- Génération automatique de QR code
- Session persistante (reconnexion automatique)
- Gestion des déconnexions

### 💬 Logique conversationnelle
- Onboarding guidé (mode → métier → chantier → langue → confirmation)
- Détection d'intentions (Danger, Aide, Quiz, etc.)
- Support texte et audio
- Gestion des états conversationnels

### 🚨 Gestion des incidents
- Signalement via mot-clé "Danger" ou "Incident"
- Support média (photo, audio)
- Notification automatique au dashboard via webhook
- Enregistrement en base de données

### ⏰ Planification automatique
- Astuces quotidiennes (8h00)
- Relances d'inactivité (10h00)
- Broadcasts programmés
- Nettoyage des utilisateurs inactifs (dimanche minuit)

### 📊 API REST
- Gestion des utilisateurs
- Consultation des incidents
- Historique des interactions
- Broadcasts ciblés

## 🚀 Installation

### Prérequis

- **Node.js** 18+ ([Télécharger](https://nodejs.org/))
- **MongoDB** ([Installation](https://www.mongodb.com/try/download/community))
- **npm** ou **yarn**

### Étapes

1. **Cloner le projet** (ou naviguer vers le dossier backend)
   ```bash
   cd backend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos valeurs
   ```

4. **Démarrer MongoDB**
   ```bash
   # Windows
   mongod
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

## ⚙️ Configuration

### Variables d'environnement (.env)

Créez un fichier `.env` à la racine du dossier `backend` :

```env
# ========== BASE DE DONNÉES ==========
MONGODB_URI=mongodb://localhost:27017/shora-bot

# ========== SERVEUR ==========
PORT=3000
NODE_ENV=development

# ========== JWT (pour authentification admin) ==========
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRE=7d

# ========== WHATSAPP ==========
WHATSAPP_BOT_NUMBER=22943222671
SUPERVISOR_PHONES=22912345678,22987654321

# ========== DASHBOARD WEBHOOK ==========
DASHBOARD_WEBHOOK_URL=http://localhost:5173/api/webhook/incident

# ========== TEXT-TO-SPEECH ==========
TTS_PROVIDER=gtts
# Options: gtts, azure, google
# Pour gtts, aucune configuration supplémentaire
# Pour Azure/Google, ajouter les clés API

# ========== FFMPEG (optionnel, pour conversion audio) ==========
FFMPEG_PATH=/usr/bin/ffmpeg
# Windows: C:\ffmpeg\bin\ffmpeg.exe
# Linux/Mac: /usr/bin/ffmpeg (généralement dans PATH)

# ========== RELANCES INACTIVITÉ ==========
INACTIVE_DAYS_THRESHOLD=7
# Nombre de jours d'inactivité avant relance

# ========== CLOUDINARY (optionnel, pour stockage média) ==========
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

### Structure des dossiers

```
backend/
├── config/           # Configuration (DB, WhatsApp)
├── controllers/      # Contrôleurs API
├── middleware/       # Middlewares Express
├── models/           # Modèles Mongoose
├── routes/           # Routes Express
├── services/         # Services métier (bot, NLP, scheduler, audio)
├── utils/            # Utilitaires (logger, formatters)
├── whatsapp/         # Client WhatsApp (Baileys)
│   ├── client.js     # Connexion Baileys
│   ├── handler.js    # Handler messages entrants
│   ├── sender.js     # Envoi messages
│   └── session/      # Session WhatsApp (créé automatiquement)
├── server.js         # Point d'entrée
└── package.json
```

## 🏃 Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur démarre avec **nodemon** (rechargement automatique).

### Mode production

```bash
npm start
```

### Premier démarrage

1. **Démarrer le serveur**
   ```bash
   npm run dev
   ```

2. **Scanner le QR code**
   - Le QR code s'affiche dans le terminal
   - Scanner avec WhatsApp (Menu → Appareils liés → Lier un appareil)
   - La session est sauvegardée dans `whatsapp/session/`

3. **Vérifier la connexion**
   - Ouvrir `http://localhost:3000/api/health`
   - Vérifier que `whatsapp.connected` est `true`

## 🏗️ Architecture

### Flux de messages

```
WhatsApp → client.js → handler.js → botService.js → MongoDB
                                    ↓
                              sender.js → WhatsApp
```

### Machine d'états conversationnels

```
new → awaiting_mode → awaiting_profession → awaiting_site_type 
  → awaiting_language → awaiting_confirmation → active
```

### Services

- **botService.js** : Logique conversationnelle principale
- **nlpService.js** : Détection d'intentions (mots-clés)
- **schedulerService.js** : Planification (cron jobs)
- **audioService.js** : Conversion texte → audio (TTS)
- **notificationService.js** : Notifications vers dashboard

## 💬 Scénario conversationnel

### 1️⃣ Première interaction

**Utilisateur** : Scanne le QR code ou envoie un message

**Bot** : 
```
Salut 👋 Je suis Shora, ton compagnon sécurité sur le chantier. 
Tu veux qu'on parle en texte ou en audio ?
```

### 2️⃣ Choix du mode

**Utilisateur** : "Texte" ou "Audio"

**Bot** : 
```
✅ Mode texte activé 📝

Quel est ton métier ?
```

### 3️⃣ Métier

**Utilisateur** : "Maçon" (ou autre)

**Bot** : 
```
✅ Métier : maçon

Quel type de chantier tu fais le plus souvent ?
```

### 4️⃣ Type de chantier

**Utilisateur** : "Construction" (ou autre)

**Bot** : 
```
✅ Type de chantier : construction

Dans quelle langue tu veux que je te parle ?
```

### 5️⃣ Langue

**Utilisateur** : "Français" (ou Fon, Yoruba)

**Bot** : 
```
✅ Langue : Français

Merci — c'est bien :
Mode: Texte 📝
Métier: maçon
Type de chantier: construction
Langue: Français

Tu confirmes ? (Oui / Non)
```

### 6️⃣ Confirmation

**Utilisateur** : "Oui"

**Bot** : 
```
🎉 Profil validé ! Bienvenue sur SHORA !

Tu recevras maintenant des conseils quotidiens de sécurité 🦺

Tape *Danger* pour signaler un incident, *Aide* pour plus d'infos.
```

**→ `user.status = true`** ✅

### 7️⃣ Utilisateur actif

- **"Danger"** → Signalement incident
- **"Aide"** → Liste des commandes
- **"Quiz"** → Quiz sécurité
- **"Profil"** → Informations utilisateur
- **👍** → +1 point

## 🧪 Tests manuels

### Test 1 : Nouvel utilisateur

1. Envoyer un message depuis un nouveau numéro WhatsApp
2. Vérifier que le bot répond avec le message de bienvenue
3. Suivre le flux d'onboarding
4. Vérifier en base : `db.users.findOne({ phoneNumber: "+229..." })`

### Test 2 : Signalement incident

1. Utilisateur actif envoie : "Danger, échafaudage instable"
2. Vérifier :
   - Message de confirmation reçu
   - Incident créé en base : `db.incidents.find()`
   - Webhook appelé (vérifier logs)

### Test 3 : Astuce quotidienne

1. Attendre 8h00 (ou modifier le cron pour tester)
2. Vérifier que tous les utilisateurs actifs reçoivent l'astuce
3. Vérifier les logs : `✅ X astuces envoyées`

### Test 4 : Relance inactivité

1. Modifier `lastInteraction` d'un utilisateur à il y a 7+ jours
2. Attendre 10h00 (ou modifier le cron)
3. Vérifier que l'utilisateur reçoit le message de relance

### Test 5 : API REST

```bash
# Health check
curl http://localhost:3000/api/health

# Liste des utilisateurs (nécessite JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/admin/users

# Liste des incidents
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/admin/incidents
```

## 🔧 Dépannage

### QR code ne s'affiche pas

- Vérifier que le terminal supporte les caractères spéciaux
- Vérifier les logs : `qrCodeData` doit être défini
- Redémarrer le serveur

### Session WhatsApp perdue

- Supprimer `whatsapp/session/` et redémarrer
- Un nouveau QR code sera généré

### Erreur MongoDB

- Vérifier que MongoDB est démarré : `mongod`
- Vérifier `MONGODB_URI` dans `.env`

### Messages non reçus

- Vérifier la connexion WhatsApp : `GET /api/health`
- Vérifier les logs du terminal
- Vérifier que le numéro est bien formaté (+229...)

### Audio ne fonctionne pas

- Installer `ffmpeg` si nécessaire
- Vérifier `TTS_PROVIDER` dans `.env`
- Vérifier les logs : `convertTextToAudio`

### Webhook dashboard non appelé

- Vérifier `DASHBOARD_WEBHOOK_URL` dans `.env`
- Vérifier que l'URL est accessible
- Vérifier les logs : `notifyDashboard`

## 📚 Documentation API

Voir [docs/API.md](./docs/API.md) pour la documentation complète des endpoints.

## 🔒 Sécurité

- ✅ JWT pour authentification admin
- ✅ Validation des numéros de téléphone
- ✅ Rate limiting (à implémenter)
- ✅ Sanitization des entrées utilisateur
- ⚠️ Session WhatsApp stockée localement (ne pas commit dans Git)

## 📝 TODO / Améliorations futures

- [ ] Intégration DialogFlow/Wit.ai pour NLP avancé
- [ ] Quiz interactifs avec boutons WhatsApp
- [ ] Géolocalisation des incidents
- [ ] Statistiques avancées (dashboard analytics)
- [ ] Support multi-langues complet (Fon, Yoruba)
- [ ] Tests unitaires et d'intégration
- [ ] Docker Compose pour déploiement
- [ ] CI/CD pipeline

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs dans le terminal
2. Consulter [docs/API.md](./docs/API.md)
3. Vérifier les issues GitHub (si applicable)

## 📄 Licence

ISC

---

**Développé avec ❤️ pour la sécurité au travail**

