<script lang="ts">
  import { drag } from "../state/drag.svelte.ts";
  import { game } from "../state/game.svelte.ts";
  import { locateCard, locateFraction } from "../lib/engine/index.ts";
  import Fraction from "./Fraction.svelte";
  import Card from "./Card.svelte";

  // Fraction ou carte en cours de drag (selon le kind du state).
  const fraction = $derived.by(() => {
    if (drag.state?.kind !== "fraction" || !game.state) return null;
    const loc = locateFraction(game.state, drag.state.fractionId);
    if (!loc) return null;
    return game.state[loc.side][loc.fractionIdx] ?? null;
  });

  const card = $derived.by(() => {
    if (drag.state?.kind !== "card" || !game.state) return null;
    const loc = locateCard(game.state, drag.state.cardId);
    console.log("[DragGhost] card drag, cardId:", drag.state.cardId, "loc:", loc);
    if (!loc) return null;
    const list =
      loc.where === "numerator"
        ? game.state[loc.side][loc.fractionIdx]!.numerator
        : game.state[loc.side][loc.fractionIdx]!.denominator ?? [];
    return list[loc.cardIdx] ?? null;
  });

  const transform = $derived(
    drag.state
      ? `translate(${drag.state.x - drag.state.offsetX}px, ${drag.state.y - drag.state.offsetY}px)`
      : "",
  );
</script>

{#if drag.state && drag.state.kind === "fraction" && fraction}
  <div class="ghost" style="transform: {transform}; width: {drag.state.width}px; height: {drag.state.height}px;">
    <Fraction {fraction} />
  </div>
{:else if drag.state && drag.state.kind === "card" && card}
  <div class="ghost" style="transform: {transform}; width: {drag.state.width}px; height: {drag.state.height}px;">
    <Card {card} />
  </div>
{/if}

<style>
  .ghost {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 200;
    pointer-events: none;
    will-change: transform;
    opacity: 0.92;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
  }
  .ghost :global(.fraction) {
    background: transparent !important;
    box-shadow: none !important;
  }
</style>
