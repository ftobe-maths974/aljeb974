<script lang="ts">
  import type { FractionInstance, Side as SideName } from "../lib/engine/index.ts";
  import Fraction from "./Fraction.svelte";

  let {
    fractions,
    name,
    onCardClick,
  }: {
    fractions: FractionInstance[];
    name: SideName;
    onCardClick?: (cardId: string) => void;
  } = $props();
</script>

<div class="side" class:lhs={name === "lhs"} class:rhs={name === "rhs"} class:pioche={name === "pioche"} data-side={name}>
  {#each fractions as fraction, i (fraction.id)}
    {#if i > 0 && name !== "pioche"}
      <span class="plus" aria-hidden="true">+</span>
    {/if}
    <Fraction {fraction} {onCardClick} />
  {/each}
</div>

<style>
  .side {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.75rem;
    border-radius: 0.75rem;
    background: var(--side-bg);
    border: 1px solid var(--side-border);
    min-height: 8rem;
  }
  .lhs, .rhs {
    flex: 1;
  }
  .pioche {
    background: rgba(0, 0, 0, 0.3);
  }
  .plus {
    font-size: 1.5rem;
    color: var(--fg);
    opacity: 0.6;
    padding: 0 0.25rem;
  }
</style>
