# Configuration WhatsApp - Shora-Bot

## 🔧 Configuration Initiale

### 1. Variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# Numéros des superviseurs (séparés par des virgules)
SUPERVISOR_PHONES=+22912345678,+22987654321

# Chemin de la session WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp/session
```

### 2. Format des numéros de téléphone

Les numéros doivent être au format international avec le préfixe `+` :
- ✅ Correct : `+22912345678`
- ✅ Correct : `+229 12 34 56 78` (les espaces sont automatiquement nettoyés)
- ❌ Incorrect : `22912345678` (sans +)
- ❌ Incorrect : `012345678` (format local)

Pour les numéros béninois :
- Format complet : `+229XXXXXXXX` (11 chiffres après le +)
- Format local : `XXXXXXXX` (8 chiffres) - sera automatiquement converti en `+229XXXXXXXX`

## 📱 Première Connexion

1. **Démarrer le serveur** :
   ```bash
   cd backend
   npm start
   ```

2. **Scanner le QR Code** :
   - Un QR code s'affiche dans le terminal
   - Ouvrir WhatsApp sur votre téléphone
   - Aller dans **Paramètres > Appareils liés > Lier un appareil**
   - Scanner le QR code affiché

3. **Vérifier la connexion** :
   - Vous devriez voir : `✅ WhatsApp connecté avec succès`
   - La session est sauvegardée dans `backend/whatsapp/session/`

## 🧪 Tester les Notifications

### Via l'API

```bash
# Vérifier le statut
curl -X GET http://localhost:3000/api/whatsapp/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Envoyer un message de test
curl -X POST http://localhost:3000/api/whatsapp/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+22912345678",
    "message": "Message de test"
  }'
```

### Via le Dashboard

1. Aller dans la section **Incidents**
2. Créer ou signaler un incident
3. Les superviseurs configurés recevront automatiquement une notification

## 🔍 Dépannage

### Problème : WhatsApp ne se connecte pas

**Solution** :
1. Vérifier que le dossier `whatsapp/session/` existe
2. Supprimer le dossier session et redémarrer :
   ```bash
   rm -rf backend/whatsapp/session
   npm start
   ```
3. Scanner le nouveau QR code

### Problème : Messages non envoyés

**Vérifications** :
1. ✅ WhatsApp est connecté (`/api/whatsapp/status`)
2. ✅ Le numéro est au bon format (avec +)
3. ✅ Le numéro existe sur WhatsApp
4. ✅ Vérifier les logs pour les erreurs détaillées

### Problème : Notifications non reçues

**Vérifications** :
1. ✅ `SUPERVISOR_PHONES` est configuré dans `.env`
2. ✅ Les numéros sont au format correct
3. ✅ WhatsApp est connecté
4. ✅ Vérifier les logs : `📊 Notifications: X réussies, Y échouées`

## 📊 Logs

Les logs WhatsApp sont visibles dans la console :
- `✅ Message envoyé avec succès` - Succès
- `❌ Erreur envoi message` - Erreur
- `📤 Envoi message à +229...` - Tentative d'envoi
- `⚠️ Aucun numéro de superviseur configuré` - Configuration manquante

## 🔐 Sécurité

- ⚠️ Ne jamais commiter le dossier `whatsapp/session/` (déjà dans `.gitignore`)
- ⚠️ Protéger l'endpoint `/api/whatsapp/test` (nécessite authentification)
- ⚠️ Valider les numéros avant envoi

## 📝 Notes

- Les messages sont envoyés avec un délai de 1 seconde entre chaque envoi pour éviter le rate limiting
- Les numéros sont automatiquement formatés (nettoyage des espaces, ajout du préfixe +229 si nécessaire)
- La connexion WhatsApp est persistante (sauvegardée dans `session/`)

