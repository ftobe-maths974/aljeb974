<script lang="ts">
  import type { FractionInstance } from "../lib/engine/index.ts";
  import Card from "./Card.svelte";

  let {
    fraction,
    onCardClick,
  }: {
    fraction: FractionInstance;
    onCardClick?: (cardId: string) => void;
  } = $props();

  const hasDen = $derived(!!fraction.denominator && fraction.denominator.length > 0);
</script>

<div class="fraction" class:has-den={hasDen} data-fraction-id={fraction.id}>
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
</style>
