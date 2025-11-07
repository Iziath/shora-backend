# Scripts Utilitaires

## Créer un utilisateur test

Ce script crée un utilisateur test dans la base de données MongoDB pour tester l'application.

### Utilisation

```bash
cd backend
npm run create-test-user
```

### Utilisateur créé

- **Téléphone** : `+22912345678`
- **Nom** : `Ouvrier Test`
- **Profession** : `maçon`
- **Langue** : `français`
- **Mode préféré** : `text`
- **Points** : `100`
- **État** : `actif`

### Note

Si l'utilisateur existe déjà, le script affichera ses informations sans le recréer.

