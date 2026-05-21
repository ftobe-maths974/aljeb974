<script lang="ts">
  import type { FractionInstance, Side as SideName } from "../lib/engine/index.ts";
  import Fraction from "./Fraction.svelte";
  import { drag } from "../state/drag.svelte.ts";

  let {
    fractions,
    name,
    onCardClick,
    onDrop,
  }: {
    fractions: FractionInstance[];
    name: SideName;
    onCardClick?: (cardId: string) => void;
    onDrop?: (sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs" }) => void;
  } = $props();

  const isHoveredSide = $derived(
    drag.isDragging() &&
      (name === "lhs" || name === "rhs") &&
      drag.hoverSide === name &&
      drag.hoverFractionId === null,
  );
</script>

<div
  class="side"
  class:lhs={name === "lhs"}
  class:rhs={name === "rhs"}
  class:pioche={name === "pioche"}
  class:hovered={isHoveredSide}
  data-side={name}
>
  {#each fractions as fraction, i (fraction.id)}
    {#if i > 0 && name !== "pioche"}
      <span class="plus" aria-hidden="true">+</span>
    {/if}
    <Fraction {fraction} {onCardClick} {onDrop} />
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
    transition: background 120ms, border-color 120ms, box-shadow 120ms;
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
  .hovered {
    background: rgba(245, 158, 11, 0.15);
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.4);
  }
</style>
