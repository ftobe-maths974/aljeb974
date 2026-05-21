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
    onDrop?: (sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs"; holeCardId?: string; divideZone?: boolean }) => void;
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
    (game.caps.multPower || game.caps.negPower) &&
      fraction.numerator.length > 1,
  );
</script>

<div
  class="fraction"
  class:has-den={hasDen}
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
        <span class="mult-dot" aria-hidden="true">×</span>
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
          <span class="mult-dot" aria-hidden="true">×</span>
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
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: background 120ms, transform 120ms, box-shadow 120ms;
  }
  .row {
    display: flex;
    align-items: center;
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
  .fraction.hovered {
    background: rgba(245, 158, 11, 0.2);
    box-shadow: 0 0 0 2px var(--accent);
  }
  .fraction.dragging {
    opacity: 0.25;
    transform: scale(0.95);
  }
</style>
