<script lang="ts">
  import type { FractionInstance } from "../lib/engine/index.ts";
  import Card from "./Card.svelte";
  import { drag, draggable } from "../state/drag.svelte.ts";

  let {
    fraction,
    onCardClick,
    onDrop,
  }: {
    fraction: FractionInstance;
    onCardClick?: (cardId: string) => void;
    onDrop?: (sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs" }) => void;
  } = $props();

  const hasDen = $derived(!!fraction.denominator && fraction.denominator.length > 0);
  const isHovered = $derived(drag.hoverFractionId === fraction.id && drag.isDragging());
  const isDragging = $derived(drag.state?.fractionId === fraction.id);
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
  <div class="row numerator">
    {#each fraction.numerator as card (card.id)}
      {#if card !== fraction.numerator[0]}
        <span class="mult-dot" aria-hidden="true">·</span>
      {/if}
      <Card {card} onclick={onCardClick} />
    {/each}
  </div>
  {#if hasDen}
    <div class="row denominator">
      {#each fraction.denominator! as card (card.id)}
        {#if card !== fraction.denominator![0]}
          <span class="mult-dot" aria-hidden="true">·</span>
        {/if}
        <Card {card} onclick={onCardClick} />
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
