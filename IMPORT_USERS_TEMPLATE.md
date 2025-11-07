# Template d'import d'utilisateurs

## Format du fichier Excel/CSV

Pour importer des utilisateurs en masse, créez un fichier Excel (.xlsx, .xls) ou CSV (.csv) avec les colonnes suivantes :

### Colonnes obligatoires
- **phoneNumber** (ou **téléphone**, **phone**) : Numéro de téléphone au format +229XXXXXXXX (obligatoire)

### Colonnes optionnelles
- **name** (ou **nom**) : Nom complet de l'utilisateur
- **profession** : Profession (maçon, électricien, plombier, charpentier, peintre, manœuvre, autre)
- **language** (ou **langue**) : Langue préférée (fr, fon, yoruba)

### Colonnes pour antécédents médicaux
- **allergies** (ou **allergie**) : Liste des allergies
- **chronicDiseases** (ou **maladie chronique**, **maladies**) : Maladies chroniques
- **medications** (ou **médicaments**) : Médicaments en cours
- **bloodType** (ou **groupe sanguin**) : Groupe sanguin (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **emergencyContactName** (ou **contact urgence nom**) : Nom du contact d'urgence
- **emergencyContactPhone** (ou **contact urgence téléphone**) : Téléphone du contact d'urgence
- **emergencyContactRelationship** (ou **contact urgence lien**) : Lien avec le contact (Ex: Époux, Frère, etc.)
- **medicalNotes** (ou **notes médicales**) : Notes médicales supplémentaires

## Exemple de fichier Excel

| phoneNumber | name | profession | language | allergies | chronicDiseases | bloodType | emergencyContactName | emergencyContactPhone |
|-------------|------|------------|----------|-----------|-----------------|-----------|---------------------|---------------------|
| +22997123456 | Jean Kouassi | maçon | fr | Pénicilline | Diabète | A+ | Marie Kouassi | +22996123456 |
| +22997234567 | Marie Ahoyo | électricien | fon | Aucune | Aucune | O+ | Paul Ahoyo | +22996234567 |

## Notes importantes

1. **Format du téléphone** : Le numéro doit commencer par +229 suivi de 8 chiffres
2. **Noms de colonnes** : Les noms de colonnes sont insensibles à la casse et aux accents
3. **Doublons** : Les utilisateurs avec un numéro de téléphone déjà existant seront ignorés
4. **Valeurs par défaut** : Si une colonne optionnelle est vide, des valeurs par défaut seront utilisées

## Utilisation

1. Créez votre fichier Excel ou CSV avec les colonnes ci-dessus
2. Allez dans la page "Utilisateurs" du dashboard
3. Cliquez sur "Importer Excel"
4. Sélectionnez votre fichier
5. Attendez la confirmation d'import

## Résultat de l'import

Après l'import, vous recevrez un résumé indiquant :
- Le nombre total de lignes traitées
- Le nombre d'utilisateurs importés avec succès
- Le nombre d'échecs
- La liste des erreurs (si applicable)

