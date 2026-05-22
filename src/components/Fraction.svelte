<script lang="ts">
  import type { FractionInstance } from "../lib/engine/index.ts";
  import Card from "./Card.svelte";
  import { drag, draggable } from "../state/drag.svelte.ts";
  import { game } from "../state/game.svelte.ts";

  let {
    fraction,
    onCardClick,
    onCardDoubleClick,
    onDrop,
    onCardDrop,
  }: {
    fraction: FractionInstance;
    onCardClick?: (cardId: string) => void;
    onCardDoubleClick?: (cardId: string) => void;
    onDrop?: (sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs"; holeCardId?: string; divideZone?: boolean; multiplyZone?: boolean }) => void;
    /** Callback pour un drag carte→carte (simplification num/dén). */
    onCardDrop?: (sourceCardId: string, targetCardId: string | null) => void;
  } = $props();

  const hasDen = $derived(!!fraction.denominator && fraction.denominator.length > 0);
  const isHovered = $derived(drag.hoverFractionId === fraction.id && drag.isDragging());
  const isDragging = $derived(
    drag.state?.kind === "fraction" && drag.state.fractionId === fraction.id,
  );
  /**
   * Drag intra-fraction sur les cartes du NUMÉRATEUR : activé dès que
   * multPower ou negPower est débloqué (chap. 4-8 et 5-1) ET qu'il existe
   * au moins une autre carte dans le numérateur pour servir de cible.
   *
   * Si le numérateur ne contient qu'UNE carte (ex : `x` ou `b`), la carte
   * n'est PAS draggable individuellement — c'est la FRACTION entière qui
   * doit pouvoir être traversée vers l'autre membre (crossPower). Sans
   * cette exclusion, le drag de carte intercepterait le pointerdown et
   * bloquerait le crossPower.
   */
  const numDraggable = $derived(
    !fraction.numeratorIsSum &&
      (game.caps.multPower || game.caps.negPower) &&
      fraction.numerator.length > 1,
  );

  // Notation du produit : « × » au début, puis « · » (point de multiplication)
  // dès que le superpouvoir multiplication est débloqué (niveau 4-8), et
  // jusqu'à la fin.
  const multSign = $derived(game.caps.multPower ? "·" : "×");
</script>

<div
  class="fraction"
  class:has-den={hasDen}
  class:grabbable={numDraggable || hasDen}
  class:hovered={isHovered}
  class:dragging={isDragging}
  data-fraction-id={fraction.id}
  use:draggable={{
    fractionId: fraction.id,
    onDrop: (t) => onDrop?.(fraction.id, t),
  }}
>
  <div class="row numerator" data-region="numerator">
    {#each fraction.numerator as card (card.id)}
      {#if card !== fraction.numerator[0]}
        <span class="mult-dot" class:plus={fraction.numeratorIsSum} aria-hidden="true">{fraction.numeratorIsSum ? "+" : multSign}</span>
      {/if}
      <Card
        {card}
        onclick={onCardClick}
        ondblclick={onCardDoubleClick}
        parentFractionId={numDraggable ? fraction.id : undefined}
        onCardDrop={numDraggable ? onCardDrop : undefined}
      />
    {/each}
  </div>
  {#if hasDen}
    <div class="row denominator" data-region="denominator">
      {#each fraction.denominator! as card (card.id)}
        {#if card !== fraction.denominator![0]}
          <span class="mult-dot" aria-hidden="true">{multSign}</span>
        {/if}
        <!-- Carte de dénominateur : draggable individuellement pour la
             simplification num/dén (e.g. p/p → 1). -->
        <Card
          {card}
          onclick={onCardClick}
          ondblclick={onCardDoubleClick}
          parentFractionId={fraction.id}
          {onCardDrop}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .fraction {
    display: inline-flex;
    flex-direction: column;
    /* stretch : les rangées (num/den) occupent toute la largeur de la
       fraction (= la plus large des deux), pour que la barre de fraction
       s'étire d'un bout à l'autre. */
    align-items: stretch;
    gap: 0.25rem;
    padding: 0.5rem 0.3rem;
    border-radius: 0.5rem;
    transition: background 120ms, transform 120ms, box-shadow 120ms;
  }
  /* Quand les cartes internes sont draggables (produit ou fraction num/dén),
     on étend la zone de saisie du TERME entier en HAUTEUR (bandes au-dessus et
     en-dessous des cartes), pas en largeur. Un overlay blanc très pâle invite à
     attraper le terme là, sans gêner le d&d interne des cartes. */
  .fraction.grabbable {
    padding-top: 1.75rem;
    padding-bottom: 1.75rem;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
    cursor: grab;
  }
  .fraction.grabbable:active {
    cursor: grabbing;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }
  .fraction.has-den .numerator {
    padding-bottom: 0.5rem;
    border-bottom: 3px solid var(--fg);
    border-radius: 2px;
  }
  .mult-dot {
    font-size: 1.5rem;
    color: var(--fg);
    opacity: 0.7;
  }
  /* Somme non réduite : « + » plus marqué que le point de multiplication. */
  .mult-dot.plus {
    font-weight: 800;
    opacity: 0.9;
  }
  .fraction.hovered {
    background: rgba(245, 158, 11, 0.2);
    box-shadow: 0 0 0 2px var(--accent);
  }
  .fraction.dragging {
    opacity: 0.25;
    transform: scale(0.95);
  }
</style>
