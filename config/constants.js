// Messages templates multilingues
const MESSAGES = {
  fr: {
    welcome: "👷 Bienvenue sur Shora-Bot ! Votre assistant sécurité au travail.\n\nRépondez avec:\n1️⃣ - M'inscrire\n2️⃣ - Signaler un danger\n3️⃣ - Astuce du jour\n4️⃣ - Mon profil",
    onboarding: {
      step1: "👋 Bonjour ! Pour commencer, quel est votre nom ?",
      step2: "Quel est votre métier ?\n1️⃣ - Maçon\n2️⃣ - Électricien\n3️⃣ - Plombier\n4️⃣ - Charpentier\n5️⃣ - Peintre\n6️⃣ - Manœuvre\n7️⃣ - Autre",
      step3: "Quelle langue préférez-vous ?\n1️⃣ - Français\n2️⃣ - Fon\n3️⃣ - Yoruba",
      step4: "Préférez-vous recevoir des messages en texte ou audio ?\n1️⃣ - Texte\n2️⃣ - Audio",
      complete: "✅ Inscription terminée ! Vous recevrez des astuces de sécurité quotidiennes."
    },
    incident: {
      prompt: "⚠️ Décrivez le danger ou l'incident que vous avez observé:",
      received: "✅ Signalement reçu. Un superviseur va examiner votre rapport.",
      media: "📷 Vous pouvez envoyer une photo ou un audio pour illustrer."
    },
    tip: {
      daily: "💡 Astuce sécurité du jour:",
      quiz: "❓ Question:",
      correct: "✅ Bonne réponse ! +10 points",
      wrong: "❌ Mauvaise réponse. La bonne réponse était:"
    },
    error: {
      unknown: "❌ Je n'ai pas compris. Répondez avec 1, 2, 3 ou 4.",
      notRegistered: "⚠️ Vous n'êtes pas encore inscrit. Répondez avec 1 pour vous inscrire."
    }
  },
  fon: {
    welcome: "👷 Mido gbo Shora-Bot! Aɖɔnugbɔ ɖoɖo tɔn.\n\n1️⃣ - Tɔn ɖo nu\n2️⃣ - Ylɔ ɖoɖo ɖé\n3️⃣ - Nuɖuɖu ɖoɖo\n4️⃣ - Nu tɔn",
    onboarding: {
      step1: "👋 Mido! Nukɔn nyi nyikɔ tɔn?",
      step2: "Nukɔn nyi nuwlan tɔn?",
      step3: "Nukɔn nyi gbɛtɔ tɔn?",
      step4: "Nukɔn nyi ɖoɖo tɔn?",
      complete: "✅ Tɔn ɖo nu wɛ!"
    },
    incident: {
      prompt: "⚠️ Ylɔ ɖoɖo ɖé:",
      received: "✅ Ylɔ ɖo nu wɛ.",
      media: "📷 A lɛ ɖɔnugbɔ ɖé."
    }
  },
  yoruba: {
    welcome: "👷 Kaabo si Shora-Bot! Oluranlowo aabo ise.\n\n1️⃣ - Forukọsilẹ\n2️⃣ - Jẹrẹ aabo\n3️⃣ - Imọran ọjọ\n4️⃣ - Profaili mi",
    onboarding: {
      step1: "👋 Kaabo! Kini orukọ rẹ?",
      step2: "Kini iṣẹ rẹ?",
      step3: "Kini ede rẹ?",
      step4: "Kini ayan rẹ?",
      complete: "✅ Forukọsilẹ ti pari!"
    },
    incident: {
      prompt: "⚠️ Ṣe apejuwe aabo tabi iṣẹlẹ:",
      received: "✅ A gba iroyin rẹ.",
      media: "📷 O le fi aworan tabi ohun ranṣẹ."
    }
  }
};

// États de conversation
const CONVERSATION_STATES = {
  NEW: 'new',
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Types d'incidents
const INCIDENT_TYPES = {
  DANGER: 'danger',
  ACCIDENT: 'accident',
  NEAR_MISS: 'near-miss',
  EQUIPMENT: 'equipment'
};

// Gravités
const SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Statuts incidents
const INCIDENT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  FALSE_ALARM: 'false-alarm'
};

// Professions
const PROFESSIONS = [
  'maçon',
  'électricien',
  'plombier',
  'charpentier',
  'peintre',
  'manœuvre',
  'autre'
];

// Langues supportées
const LANGUAGES = ['fr', 'fon', 'yoruba'];

module.exports = {
  MESSAGES,
  CONVERSATION_STATES,
  INCIDENT_TYPES,
  SEVERITIES,
  INCIDENT_STATUS,
  PROFESSIONS,
  LANGUAGES
};

