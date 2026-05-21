<script lang="ts">
  /**
   * Astuce — overlay animé qui montre à l'élève ce qu'il faut faire au niveau-clé.
   *
   * Deux modes :
   *  - "tap" (simple ou double) : un cercle pulse au-dessus de la cible
   *  - "drag" : un cercle se déplace du point de départ vers la cible
   */
  import { astuce } from "../state/astuce.svelte.ts";

  // Position et taille du curseur d'aide
  const placement = $derived.by(() => {
    if (!astuce.state) return null;
    const r = astuce.state.fromRect;
    return {
      startX: r.left + r.width / 2,
      startY: r.top + r.height / 2,
      endX: astuce.state.toRect
        ? astuce.state.toRect.left + astuce.state.toRect.width / 2
        : null,
      endY: astuce.state.toRect
        ? astuce.state.toRect.top + astuce.state.toRect.height / 2
        : null,
    };
  });
</script>

{#if astuce.state && placement}
  {#key astuce.state.tick}
    {#if astuce.state.config.kind === "tap"}
      <div
        class="hint tap"
        class:double={astuce.state.config.double}
        style="left: {placement.startX}px; top: {placement.startY}px;"
      >
        <span class="finger" aria-hidden="true">👆</span>
        <span class="halo" aria-hidden="true"></span>
      </div>
    {:else}
      <div
        class="hint drag"
        style="
          --x1: {placement.startX}px;
          --y1: {placement.startY}px;
          --x2: {placement.endX}px;
          --y2: {placement.endY}px;
        "
      >
        <span class="finger" aria-hidden="true">👆</span>
        <span class="trail" aria-hidden="true"></span>
      </div>
    {/if}
  {/key}
{/if}

<style>
  .hint {
    position: fixed;
    z-index: 250;
    pointer-events: none;
    transform: translate(-50%, -50%);
  }

  .finger {
    font-size: 2rem;
    display: inline-block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
  }

  /* --- Tap (animation halo + finger qui descend) --- */
  .tap {
    left: var(--x1);
    top: var(--y1);
  }
  .tap .finger {
    animation: tap-finger 1.2s ease-in-out infinite;
  }
  .tap.double .finger {
    animation: tap-finger 0.6s ease-in-out infinite;
  }
  .tap .halo {
    position: absolute;
    top: 50%; left: 50%;
    width: 3rem; height: 3rem;
    border: 3px solid var(--accent);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: tap-halo 1.2s ease-out infinite;
  }
  @keyframes tap-finger {
    0%, 60%, 100% { transform: translateY(0); }
    30%           { transform: translateY(6px); }
  }
  @keyframes tap-halo {
    0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.6); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
  }

  /* --- Drag (animation translation) --- */
  .drag {
    left: 0;
    top: 0;
    width: 1px;
    height: 1px;
  }
  .drag .finger {
    position: absolute;
    left: 0;
    top: 0;
    animation: drag-finger 1.6s ease-in-out infinite;
  }
  @keyframes drag-finger {
    0%   { transform: translate(calc(var(--x1) - 50%), calc(var(--y1) - 50%)); opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translate(calc(var(--x2) - 50%), calc(var(--y2) - 50%)); opacity: 0; }
  }
</style>
