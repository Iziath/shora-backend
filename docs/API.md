# 📡 API Documentation - SHORA-BOT Backend

Documentation complète des endpoints API REST du backend SHORA-BOT.

## 🔐 Authentification

La plupart des endpoints nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

Pour obtenir un token, utiliser `/api/auth/login`.

---

## 🌐 Endpoints Publics

### `GET /api/health`

Vérifie l'état du serveur et de la connexion WhatsApp.

**Réponse** :
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "whatsapp": {
    "connected": true,
    "phoneNumber": "22943222671",
    "name": "SHORA"
  },
  "database": "connected"
}
```

### `GET /health`

Route legacy pour compatibilité.

---

## 🔑 Authentification

### `POST /api/auth/login`

Connexion admin.

**Body** :
```json
{
  "username": "admin",
  "password": "password"
}
```

**Réponse** :
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin"
  }
}
```

### `GET /api/auth/verify`

Vérifie la validité d'un token.

**Headers** :
```
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "valid": true,
  "user": {
    "username": "admin"
  }
}
```

---

## 👥 Utilisateurs

### `GET /api/admin/users`

Liste tous les utilisateurs (paginé).

**Query Parameters** :
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `profession` (string, optional)
- `status` (string, optional: "active" | "inactive")
- `search` (string, optional)

**Exemple** :
```
GET /api/admin/users?page=1&limit=20&profession=maçon
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "phoneNumber": "+22912345678",
      "name": "Jean",
      "profession": "maçon",
      "chantierType": "construction",
      "language": "fr",
      "preferredMode": "text",
      "status": true,
      "points": 10,
      "lastInteraction": "2024-01-15T10:00:00.000Z",
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### `GET /api/admin/users/stats`

Statistiques des utilisateurs.

**Réponse** :
```json
{
  "success": true,
  "total": 150,
  "active": 120,
  "inactive": 30,
  "byProfession": {
    "maçon": 45,
    "électricien": 30,
    "plombier": 25
  },
  "byLanguage": {
    "fr": 100,
    "fon": 30,
    "yoruba": 20
  }
}
```

### `POST /api/admin/users`

Créer un nouvel utilisateur.

**Body** :
```json
{
  "phoneNumber": "+22912345678",
  "name": "Jean",
  "profession": "maçon",
  "chantierType": "construction",
  "language": "fr",
  "preferredMode": "text"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "phoneNumber": "+22912345678",
    "name": "Jean",
    "status": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### `POST /api/admin/users/import`

Importer des utilisateurs depuis un fichier Excel/CSV.

**Content-Type** : `multipart/form-data`

**Body** :
- `file` (file) : Fichier Excel (.xlsx) ou CSV

**Format attendu** :
| phoneNumber | name | profession | chantierType | language | preferredMode |
|-------------|------|------------|--------------|----------|---------------|
| +22912345678 | Jean | maçon | construction | fr | text |

**Réponse** :
```json
{
  "success": true,
  "imported": 10,
  "errors": []
}
```

---

## 🚨 Incidents

### `GET /api/admin/incidents`

Liste tous les incidents (paginé).

**Query Parameters** :
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string, optional: "open" | "in-progress" | "resolved")
- `severity` (string, optional: "low" | "medium" | "high")

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "type": "danger",
      "description": "Échafaudage instable",
      "mediaUrl": "https://cloudinary.com/...",
      "mediaType": "image",
      "severity": "high",
      "status": "open",
      "reportedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### `GET /api/admin/incidents/:id`

Détails d'un incident.

**Réponse** :
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "user": {
      "name": "Jean",
      "phoneNumber": "+22912345678",
      "profession": "maçon"
    },
    "type": "danger",
    "description": "Échafaudage instable",
    "mediaUrl": "https://cloudinary.com/...",
    "severity": "high",
    "status": "open",
    "reportedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### `PATCH /api/admin/incidents/:id`

Mettre à jour le statut d'un incident.

**Body** :
```json
{
  "status": "in-progress",
  "notes": "Équipe envoyée sur place"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "in-progress",
    "notes": "Équipe envoyée sur place"
  }
}
```

---

## 📨 Broadcasts

### `POST /api/admin/broadcast`

Envoyer un broadcast (message groupé).

**Body** :
```json
{
  "message": "Rappel : Port du casque obligatoire",
  "subject": "Sécurité",
  "language": "fr",
  "targetProfessions": ["maçon", "électricien"],
  "targetLanguage": "fr",
  "sendAsAudio": false,
  "scheduledSlot": "12h-14h"
}
```

**Options `scheduledSlot`** :
- `null` : Envoi immédiat
- `"7h"` : Envoi à 7h00
- `"12h-14h"` : Envoi entre 12h et 14h
- `"18h"` : Envoi à 18h00

**Réponse** :
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "message": "Rappel : Port du casque obligatoire",
    "status": "pending",
    "totalRecipients": 50,
    "scheduledTime": "2024-01-15T12:00:00.000Z"
  }
}
```

### `GET /api/admin/broadcast/history`

Historique des broadcasts.

**Query Parameters** :
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "message": "Rappel : Port du casque obligatoire",
      "status": "completed",
      "totalRecipients": 50,
      "successCount": 48,
      "errorCount": 2,
      "sentAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

---

## 📱 WhatsApp / QR Code

### `GET /api/qr/whatsapp/generate`

Génère un QR code pour connexion WhatsApp.

**Réponse** :
```json
{
  "success": true,
  "data": {
    "qrCode": "https://wa.me/22943222671?text=Écrire%20à%20SHORA",
    "qrImageUrl": "data:image/png;base64,iVBORw0KGgo...",
    "whatsappLink": "https://wa.me/22943222671?text=Écrire%20à%20SHORA",
    "botPhoneNumber": null
  }
}
```

### `GET /api/qr/whatsapp/stats`

Statistiques de connexion WhatsApp.

**Réponse** :
```json
{
  "success": true,
  "connected": true,
  "botPhoneNumber": "SHORA BOT",
  "connectedSince": "Il y a 2 heures",
  "stats": {
    "messagesSent": 1500,
    "messagesReceived": 800,
    "totalMessages": 2300,
    "activeConversations": 120
  }
}
```

### `GET /api/whatsapp/qr`

Route alternative pour QR code (dashboard).

**Réponse** :
```json
{
  "success": true,
  "qrCode": "2@...",
  "qrImageUrl": "data:image/png;base64,...",
  "message": "Scannez ce QR code avec WhatsApp pour connecter le bot"
}
```

---

## 🔔 Webhooks

### `POST /api/webhook/incident`

Webhook pour recevoir les incidents du bot (utilisé par le dashboard).

**Body** :
```json
{
  "phone": "+22912345678",
  "incidentId": "507f1f77bcf86cd799439011",
  "type": "danger",
  "message": "Échafaudage instable",
  "mediaUrls": ["https://cloudinary.com/image.jpg"],
  "timestamp": "2024-01-15T10:00:00.000Z",
  "severity": "high",
  "user": {
    "name": "Jean",
    "profession": "maçon",
    "language": "fr"
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Incident reçu",
  "incidentId": "507f1f77bcf86cd799439011"
}
```

---

## 📊 Interactions

### `GET /api/admin/interactions`

Liste des interactions (paginé).

**Query Parameters** :
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `userId` (string, optional)
- `messageType` (string, optional)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "messageType": "response",
      "content": "Bonjour",
      "timestamp": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500
  }
}
```

---

## 🧪 Exemples d'utilisation

### cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Liste des utilisateurs (avec token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/admin/users

# Créer un incident (webhook)
curl -X POST http://localhost:3000/api/webhook/incident \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+22912345678",
    "incidentId": "507f1f77bcf86cd799439011",
    "type": "danger",
    "message": "Échafaudage instable",
    "severity": "high"
  }'
```

### JavaScript (fetch)

```javascript
// Health check
const health = await fetch('http://localhost:3000/api/health')
  .then(res => res.json());

// Login
const { token } = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'password' })
}).then(res => res.json());

// Liste des utilisateurs
const users = await fetch('http://localhost:3000/api/admin/users', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());
```

---

## ⚠️ Codes d'erreur

- `200` : Succès
- `400` : Requête invalide
- `401` : Non authentifié
- `403` : Accès refusé
- `404` : Ressource non trouvée
- `500` : Erreur serveur

**Format d'erreur** :
```json
{
  "success": false,
  "error": "Message d'erreur",
  "details": "Détails supplémentaires (dev uniquement)"
}
```

---

## 📝 Notes

- Tous les timestamps sont en UTC (ISO 8601)
- Les numéros de téléphone doivent être au format international (+229...)
- Les fichiers média sont stockés sur Cloudinary (si configuré)
- Les broadcasts sont envoyés avec un délai entre chaque message (rate limiting)

---

**Dernière mise à jour** : 2024-01-15

