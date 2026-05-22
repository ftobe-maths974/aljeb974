/**
 * kwz.ts — Kréol réunioné, graphie KWZ (1983). Doit suivre exactement la
 * forme de fr.ts. Vérifié à la compilation via le type `Messages`.
 *
 * Konvansion KWZ : [w] toujour ékri "w" (zwé, mwin, dwa), [j] ékri "y"
 * (fraksyon), [k] toujour "k", [z] toujour "z", [ʃ] → "s".
 */

import type { Messages } from "../types.ts";

export const kwz: Messages = {
  meta: {
    code: "rcf-kwz",
    label: "Kréol KWZ",
    flag: "🇷🇪",
  },

  ui: {
    tagline: "Aprann rézoud bann ékwasyon an manipil bann kart.",
    playFirstLevel: "Zwé nivo 1-1",
    chooseLevel: "Swazi in nivo",
    chooseLevelTitle: "Swazi out nivo",
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
    title: "Tourn out télefòn",
    sub: "Aldjabar974 i zwé an mod péizaz.",
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
    starsLabel: (n: number) => `${n} zétwal si 3`,
    coupsRecap: (s: number, t: number) => `${s} kou si ${t} sib.`,
    next: "Apré →",
    menu: "Ménu",
    restart: "Rfé",
  },

  solution: {
    title: "Ou la trouvé !",
    titleMessy: "Ou la trouvé… mé ou té pou ankor sinplifyé 🙁",
    confirm: "War mon zétwal ✨",
  },

  fx: {
    zeroNothing: "Zéro lé aryen !",
    zeroDivideNothing: "Divizé aryen, lé toujour aryen !",
    divideByOne: "Divizé ÷1 i sanj aryen !",
    oneNoChange: "×1 i sanj aryen !",
    oppositesCancel: "Bann opozé i anil azot !",
    balanceRestored: "Mi ékilib la balans !",
    takeOpposite: "Mi vé l'opozé !",
    simplifyFraction: "Parèy an o, parèy an ba : sa i fé 1 !",
    crossSign: "Travèrs\nlé pran l'opozé !",
    fillHole: "Mi sa sinplifyé !",
    addLiterals: "Mi azout !",
    multiply: "Mi miltipliy !",
    factorize: "Mi dékonpoz !",
    negOne: "×(−1)\nlé pran l'opozé !",
    divideAll: "Mi diviz lé dé koté !",
    multiplyAll: "Mi miltipliy lé dé koté !",
  },

  keyLevels: {
    "1-1":  { title: "Lo zéro",            hint: "Lo zéro, lé aryen ditou. Tous ali, i anvol an lafimé !" },
    "1-3":  { title: "Bann opozé",         hint: "Kan in zafèr i zwenn son opozé, zot i anil azot é i rès… zéro !" },
    "1-5":  { title: "La balans ékwasyon", hint: "Lo = lé konm in balans : bann plato lé an ékilib. Lo but lo zwé : pèz x !" },
    "1-9":  { title: "La pyos",            hint: "Glis in kart la pyos pou pozé. Mé atansyon : azout ali si lé DÉ koté pou gard l'ékilib." },
    "1-16": { title: "Pran l'opozé",       hint: "Tous in kart la pyos pou sanj son sign. Plis i vyin mwin, é mwin i vyin plis !" },
    "2-1":  { title: "Bann fraksyon",      hint: "Kan mèm zafèr lé an o é an ba in fraksyon, glis azot in si lot : zot i sanj an 1 !" },
    "2-5":  { title: "Miltipliy par 1",    hint: "Miltipliy par 1 i sanj aryen. Ou pé fé disparèt bann 1 initil ek in kou dwa." },
    "2-11": { title: "Lo slot vid",        hint: "Ou vwa lo karé pwintyé an ba in fraksyon ? Glis in kart andidan pou miltipliyé." },
    "3-1":  { title: "Travèrs lo =",       hint: "Ou pé fé vwayaj in tèrm in koté ver lot. Mé an semin, son sign i retourn !" },
    "3-7":  { title: "Slot an o",          hint: "Ou pé osi poz in kart an o, dann numératèr bann lot fraksyon." },
    "4-1":  { title: "Azouté",             hint: "Glis dé nonm in si lot : zot i azout pou fé ryink in sèl." },
    "4-4":  { title: "Kas in nonm",        hint: "Doub-tous in gro nonm pou kas ali an pti morso (son bann faktèr premyé)." },
    "4-8":  { title: "Tout sinplifyé",     hint: "Konbine bann pti morso pou sinplifyé la fraksyon o maximòm. É astèr, lo « × » i vyin in pwin « · »." },
    "5-1":  { title: "Lo mwin fantonm",    hint: "Swazi in kart (i vyin vèr), apré doub-tous lo −1 pou kol ali son sign kontrèr." },
  },
};
