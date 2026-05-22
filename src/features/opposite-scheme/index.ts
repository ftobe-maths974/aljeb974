/**
 * opposite-scheme — feature isolée : représentation visuelle des cartes
 * opposées (positif vs négatif), avec bascule persistante et aperçu.
 *
 * Point d'intégration côté app :
 *  - importer le store une fois au démarrage (applique les vars sur <html>) ;
 *  - l'UI de sélection vit dans la feature card-form (CardDisplaySettings),
 *    qui pilote à la fois la forme des cartes et la représentation des opposés.
 * Card.svelte consomme le contrat de variables CSS (voir schemes.ts).
 */

export { oppositeScheme, applySchemeVars } from "./store.svelte.ts";
export { schemeStyle } from "./schemes.ts";
export {
  OPPOSITE_SCHEMES,
  DEFAULT_SCHEME_ID,
  getScheme,
  type OppositeScheme,
} from "./schemes.ts";
