<script lang="ts">
  /**
   * PuffOverlay — rend les petits nuages de vapeur déclenchés par fx.spawnPuff().
   * Chaque puff s'agrandit + s'estompe en ~700 ms.
   */
  import { fx } from "../state/fx.svelte.ts";
</script>

{#each fx.puffs as puff (puff.id)}
  <div class="puff" style="left: {puff.x}px; top: {puff.y}px;" aria-hidden="true">
    <span class="core"></span>
    <span class="cloud c1"></span>
    <span class="cloud c2"></span>
    <span class="cloud c3"></span>
    <span class="cloud c4"></span>
    <span class="cloud c5"></span>
    <span class="cloud c6"></span>
    <span class="cloud c7"></span>
    <span class="cloud c8"></span>
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

  /* Cœur opaque au point d'origine — court mais bien visible */
  .core {
    position: absolute;
    top: 0; left: 0;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0.6) 55%, transparent 100%);
    transform: translate(-50%, -50%) scale(0.6);
    animation: core-out 1100ms ease-out forwards;
  }
  @keyframes core-out {
    0%   { opacity: 0.0; transform: translate(-50%, -50%) scale(0.4); }
    20%  { opacity: 1.0; transform: translate(-50%, -50%) scale(1.4); }
    100% { opacity: 0;   transform: translate(-50%, -50%) scale(2.2); filter: blur(4px); }
  }

  .cloud {
    position: absolute;
    top: 0;
    left: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0.55) 55%, transparent 100%);
    transform: translate(-50%, -50%);
    animation: puff-out 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  }

  /* 8 lobes répartis sur 360° pour former un nuage rond */
  .c1 { animation-delay:   0ms; --dx:   0px;   --dy: -48px; }
  .c2 { animation-delay:  30ms; --dx:  34px;   --dy: -34px; }
  .c3 { animation-delay:  60ms; --dx:  48px;   --dy:   0px; }
  .c4 { animation-delay:  90ms; --dx:  34px;   --dy:  34px; }
  .c5 { animation-delay: 120ms; --dx:   0px;   --dy:  48px; }
  .c6 { animation-delay: 150ms; --dx: -34px;   --dy:  34px; }
  .c7 { animation-delay: 180ms; --dx: -48px;   --dy:   0px; }
  .c8 { animation-delay: 210ms; --dx: -34px;   --dy: -34px; }

  @keyframes puff-out {
    0%   {
      transform: translate(-50%, -50%) scale(0.35);
      opacity: 0;
    }
    25%  {
      transform: translate(calc(-50% + var(--dx, 0) * 0.4), calc(-50% + var(--dy, 0) * 0.4)) scale(1.2);
      opacity: 1;
    }
    100% {
      transform:
        translate(calc(-50% + var(--dx, 0)), calc(-50% + var(--dy, 0)))
        scale(1.6);
      opacity: 0;
      filter: blur(2px);
    }
  }
</style>
