<script lang="ts">
  /**
   * OrientationGate — bloque le contenu en portrait sur smartphone et
   * affiche un message « tourne ton téléphone ».
   *
   * Détection : matchMedia("(orientation: portrait)") + heuristique mobile (largeur).
   * On laisse passer les écrans larges (tablettes/desktop) même en portrait.
   */
  import { onMount } from "svelte";
  import { t } from "../i18n/store.svelte.ts";

  let isPortraitMobile = $state(false);

  const MOBILE_BREAKPOINT = 900; // px ; au-delà, on suppose tablette/desktop

  function check() {
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    const small = window.innerWidth < MOBILE_BREAKPOINT;
    isPortraitMobile = portrait && small;
  }

  onMount(() => {
    check();
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener("change", check);
    window.addEventListener("resize", check);
    return () => {
      mq.removeEventListener("change", check);
      window.removeEventListener("resize", check);
    };
  });

  let { children } = $props<{ children: import("svelte").Snippet }>();
</script>

{#if isPortraitMobile}
  <div class="orientation-gate" role="dialog" aria-modal="true">
    <svg viewBox="0 0 60 100" width="60" height="100" aria-hidden="true">
      <rect x="5" y="5" width="50" height="90" rx="8" fill="none" stroke="currentColor" stroke-width="3" />
      <circle cx="30" cy="88" r="3" fill="currentColor" />
    </svg>
    <p class="title">{t().orientation.title}</p>
    <p class="sub">{t().orientation.sub}</p>
  </div>
{:else}
  {@render children()}
{/if}

<style>
  .orientation-gate {
    position: fixed;
    inset: 0;
    background: var(--bg);
    color: var(--fg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    z-index: 1000;
    padding: 2rem;
    text-align: center;
  }
  .title {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 0;
  }
  .sub {
    margin: 0;
    opacity: 0.7;
  }
  svg {
    color: var(--accent);
    animation: rotate-hint 2.5s ease-in-out infinite;
  }
  @keyframes rotate-hint {
    0%, 30% { transform: rotate(0); }
    50%, 70% { transform: rotate(-90deg); }
    100% { transform: rotate(0); }
  }
</style>
