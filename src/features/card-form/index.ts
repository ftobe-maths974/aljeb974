/**
 * card-form — feature isolée : « forme » des cartes non révélées
 * (image legacy / emoji / texte), pilotée par le `reveal` de chaque niveau.
 *
 * Couplée à opposite-scheme pour l'opposé en mode emoji (réutilise l'axe A).
 *
 * Point d'intégration : poser `<CardDisplaySettings />` dans l'UI (ce panneau
 * pilote aussi les opposés). Card.svelte lit `cardForm.value` + `game.revealSet`.
 */

export { cardForm, CARD_FORMS, type CardForm } from "./store.svelte.ts";
export { emojiFor } from "./emoji.ts";
export { default as CardDisplaySettings } from "./CardDisplaySettings.svelte";
