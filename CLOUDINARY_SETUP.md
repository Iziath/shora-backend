# Guide de Configuration Cloudinary

Cloudinary est utilisé pour stocker et gérer les médias (images, audio) envoyés via WhatsApp.

## 📋 Étapes pour obtenir vos identifiants Cloudinary

### 1. Créer un compte Cloudinary (si vous n'en avez pas)

1. Allez sur [https://cloudinary.com](https://cloudinary.com)
2. Cliquez sur **"Sign Up for Free"**
3. Remplissez le formulaire d'inscription
4. Confirmez votre email

### 2. Accéder à votre Dashboard

1. Connectez-vous à votre compte Cloudinary
2. Vous serez automatiquement redirigé vers votre **Dashboard**

### 3. Récupérer vos identifiants

Dans le Dashboard, vous trouverez vos identifiants :

#### **Cloud Name** (CLOUDINARY_CLOUD_NAME)
- Visible en haut à droite du Dashboard
- Format : `dxxxxx` (exemple : `dabc123xyz`)
- C'est l'identifiant unique de votre cloud

#### **API Key** (CLOUDINARY_API_KEY)
- Visible dans la section "Account Details" du Dashboard
- Format : `123456789012345` (nombre à 15 chiffres)

#### **API Secret** (CLOUDINARY_API_SECRET)
- Visible dans la section "Account Details" du Dashboard
- ⚠️ **Important** : Cliquez sur "Reveal" pour afficher le secret
- Format : `abcdefghijklmnopqrstuvwxyz123456`
- **Ne partagez jamais cette clé !**

## 🔧 Configuration dans le fichier .env

Une fois que vous avez récupéré vos identifiants, modifiez les lignes 33-35 de `backend/.env` :

```env
CLOUDINARY_CLOUD_NAME=dxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### Exemple concret :

```env
CLOUDINARY_CLOUD_NAME=dabc123xyz
CLOUDINARY_API_KEY=987654321098765
CLOUDINARY_API_SECRET=my_secret_key_123456789_abcdefgh
```

## 📸 Capture d'écran de l'emplacement

Dans le Dashboard Cloudinary, les informations se trouvent généralement ici :

```
┌─────────────────────────────────────┐
│  Dashboard                          │
│                                     │
│  Cloud Name: dxxxxx          [📋]  │
│                                     │
│  Account Details:                  │
│  ┌───────────────────────────────┐ │
│  │ API Key: 123456789012345     │ │
│  │ API Secret: [Reveal] 🔒       │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

## ⚠️ Notes importantes

1. **Sécurité** : Ne commitez jamais votre `CLOUDINARY_API_SECRET` dans Git
2. **Plan gratuit** : Le plan gratuit de Cloudinary offre 25 GB de stockage
3. **Limites** : Vérifiez les limites de bande passante selon votre plan
4. **Alternative** : Si vous ne souhaitez pas utiliser Cloudinary, vous pouvez :
   - Laisser les valeurs par défaut (le système fonctionnera sans stockage de médias)
   - Utiliser un autre service de stockage (AWS S3, Google Cloud Storage, etc.)

## 🧪 Tester la configuration

Après avoir configuré Cloudinary, vous pouvez tester la connexion en démarrant le serveur backend. Si la configuration est correcte, le serveur démarrera sans erreur liée à Cloudinary.

## 🔗 Liens utiles

- [Documentation Cloudinary](https://cloudinary.com/documentation)
- [Dashboard Cloudinary](https://console.cloudinary.com/)
- [Guide d'intégration Node.js](https://cloudinary.com/documentation/node_integration)

