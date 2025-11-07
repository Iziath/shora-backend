# Configuration des Variables d'Environnement - Backend

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant :

```env
# ============================================
# Configuration MongoDB
# ============================================
# URI de connexion MongoDB (local ou Atlas)
# Format local: mongodb://localhost:27017/shora-bot
# Format Atlas: mongodb+srv://username:password@cluster.mongodb.net/shora-bot
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/shora-bot

# ============================================
# Configuration Serveur
# ============================================
# Port du serveur backend
PORT=3000

# Environnement (development, production, test)
NODE_ENV=development

# ============================================
# Configuration JWT (Authentification)
# ============================================
# Secret pour signer les tokens JWT (utilisez un secret fort en production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Durée de validité du token JWT
JWT_EXPIRES_IN=7d

# ============================================
# Configuration Admin
# ============================================
# Email de l'administrateur
ADMIN_EMAIL=admin@shora.com

# Mot de passe de l'administrateur (sera hashé automatiquement)
ADMIN_PASSWORD=change-this-password

# (Optionnel) Hash du mot de passe admin (si vous voulez le pré-hasher)
# ADMIN_PASSWORD_HASH=

# ============================================
# Configuration WhatsApp
# ============================================
# Chemin où seront stockées les sessions WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp/session

# Numéros de téléphone des superviseurs (séparés par des virgules)
# Format: +229XXXXXXXX (format international avec +)
# Exemple: +22912345678,+22987654321
SUPERVISOR_PHONES=+22912345678,+22987654321

# ============================================
# Configuration Cloudinary (Stockage Médias)
# ============================================
# Nom du cloud Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name

# Clé API Cloudinary
CLOUDINARY_API_KEY=your-api-key

# Secret API Cloudinary
CLOUDINARY_API_SECRET=your-api-secret

# ============================================
# Configuration Frontend (pour le QR code)
# ============================================
# URL du frontend en production (pour générer le QR code)
# En développement: laissé vide (utilise l'IP locale automatiquement)
# En production: https://votre-frontend.vercel.app
FRONTEND_URL=
DASHBOARD_URL=

# Port du frontend (développement uniquement)
FRONTEND_PORT=5173

# ============================================
# Configuration API Backend (pour le frontend)
# ============================================
# URL de l'API backend (utilisé par le frontend)
# En développement: http://localhost:3000
# En production: https://votre-domaine.com
API_URL=http://localhost:3000
```

## Instructions

1. Copiez le contenu ci-dessus dans un nouveau fichier nommé `.env` dans le dossier `backend/`
2. Remplacez toutes les valeurs par vos propres configurations
3. **Important** : Ne commitez jamais le fichier `.env` dans Git (il est déjà dans `.gitignore`)

## Variables Requises

### Obligatoires
- `MONGODB_URI` : URI de connexion à votre base de données MongoDB
- `JWT_SECRET` : Secret pour signer les tokens JWT (utilisez un secret fort)
- `ADMIN_EMAIL` : Email de l'administrateur
- `ADMIN_PASSWORD` : Mot de passe de l'administrateur

### Optionnelles (avec valeurs par défaut)
- `PORT` : Port du serveur (défaut: 3000)
- `NODE_ENV` : Environnement (défaut: development)
- `JWT_EXPIRES_IN` : Durée de validité du token (défaut: 7d)
- `WHATSAPP_SESSION_PATH` : Chemin des sessions WhatsApp (défaut: ./whatsapp/session)
- `SUPERVISOR_PHONES` : Numéros des superviseurs (peut être vide)
- `CLOUDINARY_*` : Configuration Cloudinary (optionnel si vous n'utilisez pas le stockage de médias)

