# 🤖 Intégration Chatbot SHORA - Partie QR Code

## 📋 Vue d'ensemble

Le chatbot SHORA est maintenant complètement intégré dans le projet, avec une connexion directe via les QR codes. Les utilisateurs peuvent scanner un QR code pour accéder directement au chatbot WhatsApp sans avoir besoin de connaître un numéro de téléphone.

## 🏗️ Structure du projet

```
backend/
├── whatsapp/
│   ├── client.js              # 📱 Connexion Baileys + QR Scan
│   ├── handler.js              # 📨 Réception messages WhatsApp
│   ├── sender.js               # 📤 Envoi messages (texte/audio/image)
│   └── session/                # 🔐 Session WhatsApp (auto-généré)
│
├── config/
│   ├── db.js                   # 🗄️ Connexion MongoDB
│   ├── constants.js            # 🎯 Messages templates par langue
│   └── whatsapp.config.js      # ⚙️ Config Baileys (NOUVEAU)
│
├── services/
│   ├── botService.js           # 🤖 LOGIQUE CONVERSATIONNELLE IA
│   ├── nlpService.js           # 🧠 Détection intentions (keywords)
│   ├── notificationService.js  # 🔔 Alertes superviseurs
│   ├── schedulerService.js     # ⏰ Messages quotidiens (cron)
│   └── audioService.js         # 🎤 Conversion texte→audio
│
├── controllers/
│   ├── qrController.js         # 📷 Génération QR badges + WhatsApp
│   └── ...
│
├── routes/
│   ├── qr.js                   # 🎫 Routes QR badges
│   ├── scan.js                 # 📲 Redirection QR→WhatsApp (NOUVEAU)
│   └── ...
│
└── utils/
    ├── qrGenerator.js          # 🎨 Création QR codes
    ├── phoneFormatter.js        # 📞 Format +229XXXXXXXX (NOUVEAU)
    └── ...
```

## 🔗 Intégration QR Code → Chatbot

### 1. QR Code WhatsApp (Inscription Chatbot)

**Route**: `GET /api/qr/whatsapp/generate`

- Génère un QR code qui contient un lien `wa.me` avec "Bonjour" pré-rempli
- Le QR code ouvre directement WhatsApp avec le chatbot
- Aucun numéro n'est affiché - expérience chatbot pure

**Exemple de lien généré**:
```
https://wa.me/229XXXXXXXX?text=Bonjour
```

### 2. Redirection QR → WhatsApp

**Route**: `GET /api/scan/:code`

- Redirige automatiquement vers WhatsApp avec les informations pré-remplies
- Pour les badges médicaux : envoie les informations médicales au chatbot
- Pour l'inscription : ouvre directement le chat avec "Bonjour"

### 3. Lien direct WhatsApp

**Route**: `GET /api/scan/whatsapp/link`

- Retourne le lien WhatsApp direct du chatbot
- Utile pour intégration dans d'autres systèmes

## 🎯 Fonctionnalités du Chatbot

### Réponses automatiques

Le bot répond automatiquement à tous les messages entrants :

1. **Nouvel utilisateur** :
   - Message de bienvenue automatique
   - Demande du nom
   - Processus d'onboarding

2. **Utilisateur existant** :
   - Détection d'intention (salutation, incident, astuce, profil)
   - Réponses contextuelles
   - Gestion de conversation

3. **Confirmation QR** :
   - Si `hasScannedQR: false`, demande confirmation
   - Après confirmation, `hasScannedQR: true`
   - L'utilisateur peut alors recevoir les messages programmés

### Messages programmés

- **Astuces quotidiennes** : Envoyées automatiquement chaque jour
- **Messages de diffusion** : Programmables pour 7h, 12h-14h, 18h
- **Filtres** : Seuls les utilisateurs avec `hasScannedQR: true` reçoivent les messages

## 📱 Configuration WhatsApp

### Fichier: `backend/config/whatsapp.config.js`

Centralise toute la configuration Baileys :

```javascript
{
  browser: ['SHORA BOT', 'Chrome', '1.0.0'],
  printQRInTerminal: false,
  markOnlineOnConnect: true,
  // ... autres options
}
```

### Utilisation dans `client.js`

```javascript
const { baileysConfig } = require('../config/whatsapp.config');

socket = makeWASocket({
  browser: baileysConfig.browser,
  printQRInTerminal: baileysConfig.printQRInTerminal,
  markOnlineOnConnect: baileysConfig.markOnlineOnConnect
});
```

## 🔧 Utilitaires

### `phoneFormatter.js`

Fonctions pour formater les numéros de téléphone :

- `cleanPhoneNumber()` : Nettoie un numéro (enlève +, espaces)
- `formatInternational()` : Formate en +229XXXXXXXX
- `formatWhatsAppJID()` : Formate en JID WhatsApp (229XXXXXXXX@s.whatsapp.net)
- `extractPhoneFromJID()` : Extrait le numéro d'un JID
- `isValidBeninPhone()` : Valide un numéro béninois

## 🚀 Démarrage

1. **Backend** :
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend** :
   ```bash
   cd shora_SH
   npm install
   npm run dev
   ```

3. **WhatsApp** :
   - Le bot se connecte automatiquement au démarrage
   - Scanner le QR code depuis `/api/qr/whatsapp/generate`
   - Le bot est prêt à répondre automatiquement

## 📊 Interface QR Code

La page QR Code (`shora_SH/src/pages/QRCode.tsx`) affiche :

- ✅ QR code dynamique (régénéré automatiquement)
- ✅ Statut de connexion WhatsApp
- ✅ Nom du bot : "SHORA BOT" (pas de numéro)
- ✅ Statistiques en temps réel
- ✅ Instructions pour scanner

## 🔐 Sécurité

- Les QR codes sont générés dynamiquement
- Les sessions WhatsApp sont stockées localement (`whatsapp/session/`)
- Les credentials ne sont jamais commités (dans `.gitignore`)
- JWT requis pour les routes protégées

## 📝 Notes importantes

1. **Pas de numéro visible** : Le chatbot fonctionne sans afficher de numéro
2. **Réponses automatiques** : Le bot répond à tous les messages entrants
3. **Confirmation QR** : Les utilisateurs doivent confirmer après le scan
4. **Messages programmés** : Seuls les utilisateurs confirmés (`hasScannedQR: true`) reçoivent les messages

## 🐛 Dépannage

### Le bot ne répond pas
- Vérifier que WhatsApp est connecté (`/api/qr/whatsapp/stats`)
- Vérifier les logs dans `backend/whatsapp/client.js`
- Vérifier que `botService.js` est bien appelé dans `handler.js`

### QR code ne fonctionne pas
- Vérifier que le backend est démarré
- Vérifier que WhatsApp est connecté
- Vérifier les logs dans `backend/controllers/qrController.js`

### Messages programmés ne partent pas
- Vérifier que `schedulerService.js` est initialisé
- Vérifier que les utilisateurs ont `hasScannedQR: true`
- Vérifier les logs dans `backend/services/schedulerService.js`

