/**
 * rcf.ts — Locale kréol réunioné (créole réunionnais). Doit suivre exactement
 * la forme de fr.ts. Vérifié à la compilation via le type `Messages`.
 *
 * Graphie : orthographe « tangol » souple, lisible à l'oral réunionnais.
 */

import type { Messages } from "../types.ts";

export const rcf: Messages = {
  meta: {
    code: "rcf",
    label: "Kréol Tangòl",
    flag: "🇷🇪",
  },

  ui: {
    tagline: "Apran rézoud bann ékwasyon an manipilan bann kart.",
    playFirstLevel: "Zoué nivo 1-1",
    chooseLevel: "Shoizi in nivo",
    chooseLevelTitle: "Shoizi out nivo",
    backHome: "← Akèy",
    backMenu: "← Ménu",
    chapter: "Chapit",
    chapters: "chapit",
    levels: "nivo",
    levelHeader: (chapter: number, level: number) => `Nivo ${chapter}-${level}`,
    coupsRecap: (s: number, t: number) => `${s}/${t} kou`,
    restart: "⟲",
    loading: "I sarz…",
    badges: {
      dsl: "✓ DSL analizé",
      engine: "✓ motèr TS pir",
      tests: "✓ 37 tès i marsh",
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
    starsLabel: (n: number) => `${n} zétwal si 3`,
    coupsRecap: (s: number, t: number) => `${s} kou si ${t} sib.`,
    next: "Apré →",
    menu: "Ménu",
    restart: "Rfé",
  },

  solution: {
    title: "Ou la trouvé !",
    titleMessy: "Ou la trouvé… mé ou té pou ankor sanplifyé 🙁",
    confirm: "Vwar mon zétwal ✨",
  },

  fx: {
    zeroNothing: "Zéro lé ryin !",
    oneNoChange: "×1 i sanj ryin !",
    oppositesCancel: "Bann opozé i anil azot !",
    balanceRestored: "Mi ékilib la balans !",
    takeOpposite: "Mi vé l'opozé !",
    simplifyFraction: "Parèy an o, parèy an ba : sa i fé 1 !",
    crossSign: "Travèrsé\nlé pran l'opozé !",
    fillHole: "Mi sa sanplifyé !",
    addLiterals: "Mi azout !",
    multiply: "Mi miltipliye !",
    factorize: "Mi dékonpoz !",
    negOne: "×(−1)\nlé pran l'opozé !",
    divideAll: "Mi diviz lé dé koté !",
    multiplyAll: "Mi miltipliye lé dé koté !",
  },

  keyLevels: {
    "1-1":  { title: "Lo zéro",            hint: "Lo zéro, lé ryin ditou. Tous ali, i anvol an lafimé !" },
    "1-3":  { title: "Bann opozé",         hint: "Kan in zafèr i zwenn son opozé, zot i anil azot é i rès… zéro !" },
    "1-5":  { title: "La balans ékwasyon", hint: "Lo = lé konm in balans : bann plato lé an ékilib. Lo but lo zoué : pèz x !" },
    "1-9":  { title: "La pyosh",           hint: "Glis in kart la pyosh pou pozé. Mé atansyon : azout ali si lé DÉ koté pou gard l'ékilib." },
    "1-16": { title: "Pran l'opozé",       hint: "Tous in kart la pyosh pou sanj son sign. Plis i vyin moins, é moins i vyin plis !" },
    "2-1":  { title: "Bann fraksyon",      hint: "Kan mèm zafèr lé an o é an ba in fraksyon, glis azot in si lot : zot i sanj an 1 !" },
    "2-5":  { title: "Miltipliye par 1",   hint: "Miltipliye par 1 i sanj ryin. Ou pé fé disparèt bann 1 initil ek in kou dwa." },
    "2-11": { title: "Lo slot vid",        hint: "Ou vwa lo karé pwintiyé an ba in fraksyon ? Glis in kart andidan pou miltipliyé." },
    "3-1":  { title: "Travèrs lo =",       hint: "Ou pé fé voyaj in tèrm in koté ver lot. Mé an semin, son sign i retourn !" },
    "3-7":  { title: "Slot an o",          hint: "Ou pé osi poz in kart an o, dann numératèr bann lot fraksyon." },
    "4-1":  { title: "Azouté",             hint: "Glis dé nonm in si lot : zot i azout pou fé rienk in sèl." },
    "4-4":  { title: "Kas in nonm",        hint: "Doub-tous in gro nonm pou kas ali an pti morso (son bann faktèr premié)." },
    "4-8":  { title: "Tout sanplifyé",     hint: "Konbine bann pti morso pou sanplifyé la fraksyon o maximòm. É astèr, lo « × » i vyin in pwin « · »." },
    "5-1":  { title: "Lo moins fantonm",   hint: "Shoizi in kart (i vyin vèr), apré doub-tous lo −1 pou kol ali son sign kontrèr." },
  },
};
