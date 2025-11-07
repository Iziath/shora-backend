# 🚀 Déploiement du Backend - Guide Rapide

## Option 1 : Railway (Recommandé - Gratuit)

### Étapes

1. **Créer un compte** : https://railway.app

2. **Créer un nouveau projet** :
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository

3. **Configuration du service** :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`

4. **Variables d'environnement** (Settings > Variables) :
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/shora-bot
PORT=3000
NODE_ENV=production
JWT_SECRET=votre-secret-jwt-tres-securise
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@shora.com
ADMIN_PASSWORD=votre-mot-de-passe-securise
WHATSAPP_BOT_NUMBER=22943222671
SUPERVISOR_PHONES=+22912345678,+22987654321
FRONTEND_URL=https://votre-frontend.vercel.app
DASHBOARD_URL=https://votre-frontend.vercel.app
```

5. **Obtenir l'URL** :
   - Railway génère : `https://votre-backend.railway.app`
   - Notez cette URL pour `VITE_API_URL` dans le frontend

---

## Option 2 : Render

### Étapes

1. **Créer un compte** : https://render.com

2. **Créer un nouveau Web Service** :
   - Connectez votre repository GitHub
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`

3. **Variables d'environnement** : Identiques à Railway

4. **Obtenir l'URL** :
   - Render génère : `https://votre-backend.onrender.com`

---

## ⚙️ Configuration MongoDB Atlas

1. **Créer un cluster** : https://www.mongodb.com/cloud/atlas

2. **Obtenir l'URI** :
   - Connect > Connect your application
   - Copiez l'URI : `mongodb+srv://user:password@cluster.mongodb.net/shora-bot`

3. **Configurer l'accès réseau** :
   - Network Access > Add IP Address
   - Ajoutez `0.0.0.0/0` (tous les IPs) pour Railway/Render

4. **Ajouter dans les variables d'environnement** :
   - `MONGODB_URI=mongodb+srv://...`

---

## 📱 Configuration WhatsApp

1. **Démarrer le backend** (déploiement automatique)

2. **Voir les logs** :
   - Railway : Onglet "Deployments" > "View Logs"
   - Render : Onglet "Logs"

3. **Scanner le QR code** :
   - Le QR code apparaît dans les logs
   - Scannez-le avec WhatsApp pour lier la session

4. **Session persistante** :
   - La session est sauvegardée dans le système de fichiers
   - Elle persiste entre les redémarrages

---

## ⚠️ Important : Configuration FRONTEND_URL

**Après avoir déployé le frontend**, mettez à jour :

1. Allez dans Settings > Variables
2. Ajoutez ou modifiez :
   ```
   FRONTEND_URL=https://votre-frontend.vercel.app
   DASHBOARD_URL=https://votre-frontend.vercel.app
   ```
3. Le backend redémarre automatiquement

Le QR code pointera maintenant vers votre frontend en production !

---

## ✅ Vérification

1. **Test de santé** :
   ```bash
   curl https://votre-backend.railway.app/api/health
   ```

2. **Vérifier les logs** :
   - Vérifiez que MongoDB est connecté
   - Vérifiez que WhatsApp est connecté

3. **Tester le QR code** :
   - Connectez-vous au dashboard
   - Allez sur "Codes QR"
   - Vérifiez que le QR code pointe vers votre frontend

