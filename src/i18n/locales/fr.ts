/**
 * fr.ts — Locale française (référence). Tous les autres locales ont
 * exactement la même forme (voir Messages dans ../types.ts).
 *
 * Conventions :
 *  - Les chaînes simples sont des string.
 *  - Les chaînes avec interpolation sont des fonctions pures (a, b) => string.
 *  - Les hints des niveaux-clés sont indexés par id (ex: "1-1").
 */

export const fr = {
  meta: {
    code: "fr",
    label: "Français",
    flag: "🇫🇷",
  },

  ui: {
    tagline: "Apprends à résoudre des équations en manipulant des cartes.",
    playFirstLevel: "Jouer le niveau 1-1",
    chooseLevel: "Choisir un niveau",
    chooseLevelTitle: "Choisis un niveau",
    backHome: "← Accueil",
    backMenu: "← Menu",
    chapter: "Chapitre",
    chapters: "chapitres",
    levels: "niveaux",
    levelHeader: (chapter: number, level: number) => `Niveau ${chapter}-${level}`,
    coupsRecap: (s: number, t: number) =>
      `${s}/${t} coup${s > 1 || t > 1 ? "s" : ""}`,
    restart: "⟲",
    loading: "Chargement…",
    badges: {
      dsl: "✓ DSL parsé",
      engine: "✓ moteur TS pur",
      tests: "✓ 37 tests verts",
    },
    githubLink: "github.com/ftobe-maths974/aljeb974",
  },

  orientation: {
    title: "Tourne ton téléphone",
    sub: "Aljeb974 se joue en mode paysage.",
  },

  pending: {
    message: "Pose la même carte de l'autre côté pour préserver l'équivalence.",
    cancel: "Annuler",
  },

  flash: {
    line1: "Dépose cette carte",
    line2: "de l'autre côté aussi",
  },

  drop: {
    hintTop: "Dépose",
    hintBottom: "ici aussi",
  },

  victory: {
    title: "Bravo !",
    starsLabel: (n: number) => `${n} étoile${n > 1 ? "s" : ""} sur 3`,
    coupsRecap: (s: number, t: number) =>
      `${s} coup${s > 1 ? "s" : ""} sur ${t} cible.`,
    next: "Suivant →",
    menu: "Menu",
    restart: "Refaire",
  },

  solution: {
    title: "Tu as trouvé !",
    titleMessy: "Tu as trouvé… mais tu pouvais encore simplifier 🙁",
    confirm: "Voir mes étoiles ✨",
  },

  fx: {
    zeroNothing: "Zéro c'est rien !",
    oneNoChange: "×1 ne change rien !",
    oppositesCancel: "Les opposés s'annulent !",
    balanceRestored: "J'équilibre la balance !",
    takeOpposite: "Je veux l'opposé !",
    simplifyFraction: "Pareil en haut, pareil en bas : ça fait 1 !",
    crossSign: "Traverser\nc'est prendre l'opposé !",
    fillHole: "Je vais simplifier !",
    addLiterals: "J'additionne !",
    multiply: "Je multiplie !",
    factorize: "Je décompose !",
    negOne: "×(−1)\nc'est prendre l'opposé !",
  },

  keyLevels: {
    "1-1":  { title: "Le zéro",            hint: "Le zéro, c'est rien du tout. Touche-le, il s'envole en fumée !" },
    "1-3":  { title: "Les opposés",        hint: "Quand un truc rencontre son opposé, ils s'annulent et il reste… zéro !" },
    "1-5":  { title: "La balance Équation", hint: "Le = est comme une balance : les plateaux sont en équilibre. Le but du jeu : peser x !" },
    "1-9":  { title: "La pioche",          hint: "Glisse une carte de la pioche pour la poser. Mais attention : ajoute-la sur les DEUX côtés pour garder l'équilibre." },
    "1-16": { title: "Prendre l'opposé",   hint: "Touche une carte de la pioche pour changer son signe. Plus devient moins, et moins devient plus !" },
    "2-1":  { title: "Les fractions",      hint: "Quand la même chose est en haut et en bas d'une fraction, glisse-les l'une sur l'autre : elles se transforment en 1 !" },
    "2-5":  { title: "Multiplier par 1",   hint: "Multiplier par 1 ne change rien. Tu peux faire disparaître les 1 inutiles d'un coup de doigt." },
    "2-11": { title: "Le slot vide",       hint: "Tu vois le carré pointillé en bas d'une fraction ? Glisse une carte dedans pour la multiplier." },
    "3-1":  { title: "Traverser le =",     hint: "Tu peux faire voyager un terme d'un côté à l'autre. Mais en chemin, son signe se retourne !" },
    "3-7":  { title: "Slot du haut",       hint: "Tu peux aussi déposer une carte au-dessus, dans le numérateur des autres fractions." },
    "4-1":  { title: "Additionner",        hint: "Glisse deux nombres l'un sur l'autre : ils s'additionnent pour n'en faire qu'un seul." },
    "4-4":  { title: "Casser un nombre",   hint: "Double-touche un grand nombre pour le casser en petits morceaux (ses facteurs premiers)." },
    "4-8":  { title: "Tout simplifier",    hint: "Combine les petits morceaux pour simplifier la fraction au maximum." },
    "5-1":  { title: "Le moins fantôme",   hint: "Choisis une carte (elle devient verte), puis double-touche le −1 pour lui coller son signe contraire." },
  },
} as const;
