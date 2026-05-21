<script lang="ts">
  /**
   * PuffOverlay — rend les petits nuages de vapeur déclenchés par fx.spawnPuff().
   * Chaque puff s'agrandit + s'estompe en ~700 ms.
   */
  import { fx } from "../state/fx.svelte.ts";
</script>

{#each fx.puffs as puff (puff.id)}
  <div class="puff" style="left: {puff.x}px; top: {puff.y}px;" aria-hidden="true">
    <span class="cloud c1"></span>
    <span class="cloud c2"></span>
    <span class="cloud c3"></span>
    <span class="cloud c4"></span>
    <span class="cloud c5"></span>
  </div>
{/each}

<style>
  .puff {
    position: fixed;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 150;
  }
  .cloud {
    position: absolute;
    top: 0;
    left: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0.5) 60%, transparent 100%);
    transform: translate(-50%, -50%);
    animation: puff-out 700ms ease-out forwards;
  }
  .c1 { animation-delay:   0ms; --dx:   0px; --dy: -28px; }
  .c2 { animation-delay:  40ms; --dx:  26px; --dy: -10px; }
  .c3 { animation-delay:  80ms; --dx:  16px; --dy:  24px; }
  .c4 { animation-delay: 120ms; --dx: -22px; --dy:  20px; }
  .c5 { animation-delay: 160ms; --dx: -24px; --dy: -16px; }

  @keyframes puff-out {
    0%   {
      transform: translate(-50%, -50%) scale(0.4);
      opacity: 0.9;
    }
    100% {
      transform:
        translate(calc(-50% + var(--dx, 0)), calc(-50% + var(--dy, 0)))
        scale(1.4);
      opacity: 0;
    }
  }
</style>
