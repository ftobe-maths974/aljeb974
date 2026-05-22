/**
 * kreol77.ts — Kréol réunioné, graphie « Lékritir 77 » (1977). Doit suivre
 * exactement la forme de fr.ts. Vérifié à la compilation via `Messages`.
 *
 * Konvansion 77 : [w] ékri "ou/oi" (zoué, moin, doi), [j] ékri "i"
 * (fraksion), [ʃ] → "s". Pli foném, pli pré lo loral.
 */

import type { Messages } from "../types.ts";

export const kreol77: Messages = {
  meta: {
    code: "rcf-77",
    label: "Kréol 77",
    flag: "🇷🇪",
  },

  ui: {
    tagline: "Apran rézoud bann ékwasion an manipil bann kart.",
    playFirstLevel: "Zoué nivo 1-1",
    chooseLevel: "Soizi in nivo",
    chooseLevelTitle: "Soizi out nivo",
    backHome: "← Akèy",
    backMenu: "← Ménu",
    chapter: "Sapit",
    chapters: "sapit",
    levels: "nivo",
    levelHeader: (chapter: number, level: number) => `Nivo ${chapter}-${level}`,
    coupsRecap: (s: number, t: number) => `${s}/${t} kou`,
    restart: "⟲",
    loading: "I sarz…",
    badges: {
      dsl: "✓ DSL analizé",
      engine: "✓ motèr TS pir",
      tests: "✓ 37 tès i mars",
    },
    githubLink: "github.com/ftobe-maths974/aljeb974",
  },

  orientation: {
    title: "Tourn out téléfòn",
    sub: "Aldjabar974 i zoué an mod péizaz.",
  },

  pending: {
    message: "Poz mèm kart de lot koté pou gard l'ékilib.",
    cancel: "Anilé",
  },

  flash: {
    line1: "Poz sa kart la",
    line2: "de lot koté osi",
  },

  drop: {
    hintTop: "Poz",
    hintBottom: "isi osi",
  },

  victory: {
    title: "Bravo !",
    starsLabel: (n: number) => `${n} zétoil si 3`,
    coupsRecap: (s: number, t: number) => `${s} kou si ${t} sib.`,
    next: "Apré →",
    menu: "Ménu",
    restart: "Rfé",
  },

  solution: {
    title: "Ou la trouvé !",
    titleMessy: "Ou la trouvé… mé ou té pou ankor sinplifié 🙁",
    confirm: "War mon zétoil ✨",
  },

  fx: {
    zeroNothing: "Zéro lé arien !",
    zeroDivideNothing: "Divizé arien, lé toujour arien !",
    divideByOne: "÷1 i sanj arien !",
    oneNoChange: "×1 i sanj arien !",
    oppositesCancel: "Bann opozé i anil azot !",
    balanceRestored: "Mi ékilib la balans !",
    takeOpposite: "Mi vé l'opozé !",
    simplifyFraction: "Parèy an o, parèy an ba : sa i fé 1 !",
    crossSign: "Travèrs\nlé pran l'opozé !",
    fillHole: "Mi sa sinplifié !",
    addLiterals: "Mi azout !",
    multiply: "Mi miltipli !",
    factorize: "Mi dékonpoz !",
    negOne: "×(−1)\nlé pran l'opozé !",
    divideAll: "Mi diviz lé dé koté !",
    multiplyAll: "Mi miltipli lé dé koté !",
  },

  keyLevels: {
    "1-1":  { title: "Lo zéro",            hint: "Lo zéro, lé arien ditou. Tous ali, i anvol an lafimé !" },
    "1-3":  { title: "Bann opozé",         hint: "Kan in zafèr i zoinn son opozé, zot i anil azot é i rès… zéro !" },
    "1-5":  { title: "La balans ékwasion", hint: "Lo = lé konm in balans : bann plato lé an ékilib. Lo but lo zoué : pèz x !" },
    "1-9":  { title: "La piose",           hint: "Glis in kart la piose pou pozé. Mé atansion : azout ali si lé DÉ koté pou gard l'ékilib." },
    "1-16": { title: "Pran l'opozé",       hint: "Tous in kart la piose pou sanj son sign. Plis i vien moin, é moin i vien plis !" },
    "2-1":  { title: "Bann fraksion",      hint: "Kan mèm zafèr lé an o é an ba in fraksion, glis azot in si lot : zot i sanj an 1 !" },
    "2-5":  { title: "Miltipli par 1",     hint: "Miltipli par 1 i sanj arien. Ou pé fé disparèt bann 1 initil ek in kou doi." },
    "2-11": { title: "Lo slot vid",        hint: "Ou voi lo karé pwintié an ba in fraksion ? Glis in kart andidan pou miltiplié." },
    "3-1":  { title: "Travèrs lo =",       hint: "Ou pé fé voiaj in tèrm in koté ver lot. Mé an semin, son sign i retourn !" },
    "3-7":  { title: "Slot an o",          hint: "Ou pé osi poz in kart an o, dann numératèr bann lot fraksion." },
    "4-1":  { title: "Azouté",             hint: "Glis dé nonm in si lot : zot i azout pou fé rienk in sèl." },
    "4-4":  { title: "Kas in nonm",        hint: "Doub-tous in gro nonm pou kas ali an pti morso (son bann faktèr premié)." },
    "4-8":  { title: "Tout sinplifié",     hint: "Konbine bann pti morso pou sinplifié la fraksion o maximòm. É astèr, lo « × » i vien in pwin « · »." },
    "5-1":  { title: "Lo moin fantonm",    hint: "Soizi in kart (i vien vèr), apré doub-tous lo −1 pou kol ali son sign kontrèr." },
  },
};
