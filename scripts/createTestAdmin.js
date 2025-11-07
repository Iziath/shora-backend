/**
 * Script pour créer un utilisateur admin de test
 * Usage: node scripts/createTestAdmin.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createTestAdmin() {
  console.log('\n🔐 ========== CRÉATION UTILISATEUR ADMIN DE TEST ==========\n');
  
  try {
    // Afficher les credentials actuels
    const currentEmail = process.env.ADMIN_EMAIL || 'admin@shora.com';
    const currentPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    console.log('📋 Credentials actuels (depuis .env):');
    console.log(`   Email: ${currentEmail}`);
    console.log(`   Password: ${currentPassword}\n`);
    
    // Demander si l'utilisateur veut créer un nouvel admin
    const createNew = await question('Voulez-vous créer un nouvel utilisateur admin ? (o/n): ');
    
    if (createNew.toLowerCase() !== 'o' && createNew.toLowerCase() !== 'oui') {
      console.log('\n✅ Utilisation des credentials existants.');
      console.log('\n📝 Pour vous connecter au dashboard:');
      console.log(`   Email: ${currentEmail}`);
      console.log(`   Password: ${currentPassword}\n`);
      rl.close();
      return;
    }
    
    // Demander les nouvelles informations
    console.log('\n📝 Entrez les informations du nouvel admin:\n');
    
    const email = await question('Email: ');
    if (!email || !email.includes('@')) {
      console.log('❌ Email invalide');
      rl.close();
      return;
    }
    
    const password = await question('Mot de passe: ');
    if (!password || password.length < 6) {
      console.log('❌ Le mot de passe doit contenir au moins 6 caractères');
      rl.close();
      return;
    }
    
    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Afficher les informations pour .env
    console.log('\n✅ Utilisateur admin créé avec succès !\n');
    console.log('📝 Ajoutez ces lignes dans votre fichier backend/.env :\n');
    console.log(`ADMIN_EMAIL=${email}`);
    console.log(`ADMIN_PASSWORD=${password}`);
    console.log(`# Ou directement le hash (optionnel):`);
    console.log(`# ADMIN_PASSWORD_HASH=${passwordHash}\n`);
    console.log('📋 Credentials pour se connecter:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
    console.log('⚠️  N\'oubliez pas de redémarrer le serveur backend après avoir modifié le .env !\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    rl.close();
  }
}

// Exécuter le script
createTestAdmin();

