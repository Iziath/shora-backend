# 📝 Exemple de fichier .env

Copiez ce contenu dans un fichier `.env` à la racine du dossier `backend/` :

```env
# ========== BASE DE DONNÉES ==========
MONGODB_URI=mongodb://localhost:27017/shora-bot

# ========== SERVEUR ==========
PORT=3000
NODE_ENV=development

# ========== JWT (pour authentification admin) ==========
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
JWT_EXPIRE=7d

# ========== WHATSAPP ==========
WHATSAPP_BOT_NUMBER=22943222671
SUPERVISOR_PHONES=22912345678,22987654321

# ========== DASHBOARD WEBHOOK ==========
DASHBOARD_WEBHOOK_URL=http://localhost:5173/api/webhook/incident

# ========== TEXT-TO-SPEECH ==========
TTS_PROVIDER=gtts

# ========== FFMPEG (optionnel) ==========
FFMPEG_PATH=

# ========== RELANCES INACTIVITÉ ==========
INACTIVE_DAYS_THRESHOLD=7

# ========== CLOUDINARY (optionnel) ==========
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Instructions

1. Créez un fichier `.env` dans `backend/`
2. Copiez le contenu ci-dessus
3. Remplacez les valeurs par vos propres configurations
4. **Important** : Ne commitez jamais le fichier `.env` dans Git

