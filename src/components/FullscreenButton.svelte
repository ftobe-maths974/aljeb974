<script lang="ts">
  /**
   * Bouton plein écran global, fixé en haut à gauche. Visible tant qu'on n'est
   * PAS en plein écran ; il se masque une fois en plein écran (on en sort via
   * Échap / le geste système). Gère les préfixes webkit (Safari).
   */
  let isFullscreen = $state(false);

  function fsElement(): Element | null {
    return (
      document.fullscreenElement ??
      (document as unknown as { webkitFullscreenElement?: Element })
        .webkitFullscreenElement ??
      null
    );
  }

  function sync() {
    isFullscreen = fsElement() !== null;
  }

  async function enter() {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const req = el.requestFullscreen ?? el.webkitRequestFullscreen;
    if (req) {
      try {
        await req.call(el);
      } catch {
        /* refus utilisateur / non supporté → on ignore */
      }
    }
  }

  $effect(() => {
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  });
</script>

{#if !isFullscreen}
  <button
    class="fs-btn"
    onclick={enter}
    aria-label="Plein écran"
    title="Plein écran"
  >
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
      />
    </svg>
  </button>
{/if}

<style>
  .fs-btn {
    position: fixed;
    top: 0.6rem;
    left: 0.6rem;
    z-index: 1000;
    width: 2.1rem;
    height: 2.1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.6rem;
    color: var(--fg);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    opacity: 0.7;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    transition: opacity 120ms, background 120ms, transform 120ms;
  }
  .fs-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.16);
    transform: scale(1.05);
  }
  .fs-btn:active {
    transform: scale(0.96);
  }
</style>
