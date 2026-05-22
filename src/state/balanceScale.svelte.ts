/**
 * balanceScale.svelte.ts — échelle PARTAGÉE des deux plateaux (lhs/rhs).
 *
 * Chaque Side publie ici le scale dont il a besoin pour tenir dans sa moitié.
 * Les deux côtés appliquent ensuite le PLUS PETIT des deux (Math.min), afin que
 * toutes les cartes de l'équation aient exactement la même taille — un scale
 * uniforme sur la largeur totale, pas de grosses cartes d'un côté et de petites
 * de l'autre.
 *
 * Valeur 1 = pas de réduction. Un côté absent (niveau sans équation) est remis
 * à 1 par le Side correspondant (onDestroy) pour ne pas fausser le min.
 */
class BalanceScale {
  lhs = $state(1);
  rhs = $state(1);
}

export const balanceScale = new BalanceScale();
