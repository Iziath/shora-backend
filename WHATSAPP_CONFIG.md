# Guide de Configuration WhatsApp

Configuration des lignes 27-28 du fichier `.env` pour WhatsApp.

## 📋 Variables à configurer

### Ligne 27 : `WHATSAPP_SESSION_PATH`
### Ligne 28 : `SUPERVISOR_PHONES`

---

## 🔧 Configuration de WHATSAPP_SESSION_PATH (Ligne 27)

### Description
Chemin où seront stockées les sessions WhatsApp. Les sessions permettent de maintenir la connexion WhatsApp sans avoir à scanner le QR code à chaque démarrage.

### Valeur par défaut
```env
WHATSAPP_SESSION_PATH=./whatsapp/session
```

### Options de configuration

#### Option 1 : Chemin relatif (recommandé pour développement)
```env
WHATSAPP_SESSION_PATH=./whatsapp/session
```
- Les fichiers de session seront créés dans `backend/whatsapp/session/`
- Créez ce dossier s'il n'existe pas déjà

#### Option 2 : Chemin absolu (recommandé pour production)
```env
WHATSAPP_SESSION_PATH=/var/www/shora-bot/whatsapp/session
```
- Utilisez un chemin absolu pour plus de contrôle
- Assurez-vous que le dossier existe et a les permissions d'écriture

### ⚠️ Important
- Le dossier doit exister avant le premier démarrage
- Le dossier doit avoir les permissions d'écriture
- Ne supprimez pas ce dossier, sinon vous devrez scanner le QR code à nouveau

### Création du dossier (si nécessaire)
```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Path "backend\whatsapp\session" -Force

# Linux/Mac
mkdir -p backend/whatsapp/session
```

---

## 📱 Configuration de SUPERVISOR_PHONES (Ligne 28)

### Description
Liste des numéros de téléphone des superviseurs qui recevront des notifications WhatsApp lorsqu'un incident est signalé.

### Format requis
- Format international avec le préfixe `+`
- Numéros séparés par des virgules (sans espaces)
- Format béninois : `+229XXXXXXXX` (11 chiffres après le +)

### Exemples

#### Un seul superviseur
```env
SUPERVISOR_PHONES=+22912345678
```

#### Plusieurs superviseurs
```env
SUPERVISOR_PHONES=+22912345678,+22987654321,+22911223344
```

#### Votre configuration actuelle
```env
SUPERVISOR_PHONES=+2290153930031
```

### ✅ Format correct
- ✅ `+22912345678`
- ✅ `+229 12 34 56 78` (les espaces seront automatiquement supprimés)
- ✅ `+22912345678,+22987654321`

### ❌ Format incorrect
- ❌ `22912345678` (sans le +)
- ❌ `012345678` (format local)
- ❌ `+229-123-456-78` (avec tirets)
- ❌ `+22912345678, +22987654321` (avec espaces après la virgule)

### 📝 Comment obtenir le format correct

#### Pour un numéro béninois :
1. Prenez le numéro local : `01 53 93 00 31`
2. Supprimez les espaces : `0153930031`
3. Ajoutez le préfixe `+229` : `+2290153930031`

#### Vérification du format :
- Doit commencer par `+229`
- Suivi de 8 chiffres (numéro local)
- Total : 11 chiffres après le `+`

### 🔔 Fonctionnalité
Quand un ouvrier signale un incident via WhatsApp :
1. L'incident est enregistré dans la base de données
2. Tous les numéros dans `SUPERVISOR_PHONES` reçoivent automatiquement une notification WhatsApp avec :
   - La gravité de l'incident
   - Le nom et numéro de l'ouvrier
   - La description de l'incident
   - La localisation (si fournie)
   - L'heure du signalement

---

## 📋 Configuration complète recommandée

```env
# Configuration WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp/session
SUPERVISOR_PHONES=+2290153930031,+22912345678
```

### Pour plusieurs superviseurs :
```env
SUPERVISOR_PHONES=+2290153930031,+22912345678,+22987654321
```

---

## 🧪 Tester la configuration

### 1. Vérifier que le dossier de session existe
```bash
# Windows
Test-Path backend\whatsapp\session

# Linux/Mac
test -d backend/whatsapp/session && echo "OK" || echo "Manquant"
```

### 2. Vérifier le format des numéros
- Assurez-vous que tous les numéros commencent par `+229`
- Vérifiez qu'il n'y a pas d'espaces après les virgules
- Testez avec un seul numéro d'abord

### 3. Démarrer le serveur
```bash
cd backend
npm start
```

### 4. Scanner le QR code
- Un QR code s'affichera dans le terminal
- Scannez-le avec WhatsApp sur votre téléphone
- La session sera sauvegardée dans le dossier configuré

---

## ⚠️ Notes importantes

1. **Sécurité** : Ne partagez jamais votre fichier `.env` contenant les numéros de superviseurs
2. **Session WhatsApp** : 
   - La première connexion nécessite de scanner un QR code
   - Les connexions suivantes utilisent la session sauvegardée
   - Si vous supprimez le dossier de session, vous devrez scanner à nouveau
3. **Numéros de superviseurs** :
   - Les numéros doivent être des numéros WhatsApp valides
   - Les superviseurs recevront des notifications même s'ils ne sont pas dans la base de données
4. **Format des numéros** :
   - Le système nettoie automatiquement les espaces
   - Mais évitez les espaces pour plus de clarté

---

## 🔧 Dépannage

### Problème : Le QR code ne s'affiche pas
- Vérifiez que le dossier `whatsapp/session` existe
- Vérifiez les permissions d'écriture

### Problème : Les notifications ne sont pas envoyées
- Vérifiez que WhatsApp est bien connecté
- Vérifiez le format des numéros dans `SUPERVISOR_PHONES`
- Vérifiez les logs du serveur pour les erreurs

### Problème : Format de numéro incorrect
- Assurez-vous que tous les numéros commencent par `+229`
- Vérifiez qu'il n'y a pas d'espaces après les virgules
- Utilisez uniquement des chiffres après `+229`

