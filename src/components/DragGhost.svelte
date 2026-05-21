<script lang="ts">
  import { drag } from "../state/drag.svelte.ts";
  import { game } from "../state/game.svelte.ts";
  import { locateFraction } from "../lib/engine/index.ts";
  import Fraction from "./Fraction.svelte";

  // Récupère la fraction en cours de drag (depuis l'état de jeu).
  const fraction = $derived.by(() => {
    if (!drag.state || !game.state) return null;
    const loc = locateFraction(game.state, drag.state.fractionId);
    if (!loc) return null;
    return game.state[loc.side][loc.fractionIdx] ?? null;
  });

  const transform = $derived(
    drag.state
      ? `translate(${drag.state.x - drag.state.offsetX}px, ${drag.state.y - drag.state.offsetY}px)`
      : "",
  );
</script>

{#if drag.state && fraction}
  <div class="ghost" style="transform: {transform}; width: {drag.state.width}px; height: {drag.state.height}px;">
    <Fraction {fraction} />
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
  /* Désactiver l'animation du x dans le ghost pour qu'il suive bien le doigt */
  .ghost :global(.fraction) {
    background: transparent !important;
    box-shadow: none !important;
  }
</style>
