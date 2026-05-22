/**
 * store.svelte.ts — réglage de la « forme des cartes » (axe B).
 *
 *   "image" : cartes non révélées = sprites PNG legacy (public/cartes/)
 *   "emoji" : cartes non révélées = emoji (cf. emoji.ts), opposé via opposite-scheme
 *   "text"  : pas de sprite, tout en texte (ignore le reveal — comportement
 *             « tout dévoilé »)
 *
 * Les modes image/emoji respectent l'évolution du `reveal` de chaque niveau :
 * seules les cartes NON révélées prennent la forme cachée. La décision
 * texte/sprite est faite dans Card.svelte via shouldRevealAsText + game.revealSet.
 */

export type CardForm = "image" | "emoji" | "text";

export const CARD_FORMS: { id: CardForm; label: { fr: string; en: string }; icon: string }[] = [
  { id: "image", label: { fr: "Legacy", en: "Legacy" }, icon: "🖼️" },
  { id: "emoji", label: { fr: "Emoji", en: "Emoji" }, icon: "😀" },
  { id: "text", label: { fr: "Texte", en: "Text" }, icon: "🔤" },
];

const STORAGE_KEY = "aljeb974:card-form";
const DEFAULT: CardForm = "emoji";

function loadInitial(): CardForm {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "image" || raw === "emoji" || raw === "text" ? raw : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

class CardFormStore {
  value = $state<CardForm>(loadInitial());

  set(form: CardForm) {
    this.value = form;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, form);
      } catch {
        /* QuotaExceeded / privacy mode → ignore */
      }
    }
  }
}

export const cardForm = new CardFormStore();

if (typeof window !== "undefined") {
  (window as unknown as { aljebCardForm: CardFormStore }).aljebCardForm = cardForm;
}
