/**
 * types.ts — Type-safety pour tous les locales.
 *
 * La forme `Messages` est dérivée de la locale FR (référence). Toute autre
 * locale doit avoir EXACTEMENT la même structure ; le compilateur le vérifie
 * via la signature `Messages` importée dans chaque fichier de locale.
 *
 * Pour ajouter une langue :
 *   1. Copier locales/fr.ts vers locales/xx.ts
 *   2. Traduire les valeurs (le compilateur signale les manquants)
 *   3. Référencer dans ./store.svelte.ts
 */

import type { fr } from "./locales/fr.ts";

// Le `as const` côté fr donne des types littéraux trop restrictifs (ex: "Bravo !")
// pour le simple usage runtime. On désature donc en construisant `Messages` à la main
// à partir de la forme observable de `fr`. On garde toutefois la liaison via `typeof`
// pour ne pas dupliquer la définition.
type Loose<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends (...args: infer A) => infer R ? (...args: A) => R :
  T extends ReadonlyArray<infer U> ? U[] :
  T extends object ? { [K in keyof T]: Loose<T[K]> } :
  T;

export type Messages = Loose<typeof fr>;
