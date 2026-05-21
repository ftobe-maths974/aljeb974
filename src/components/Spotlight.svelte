<script lang="ts">
  /**
   * Spotlight — un « ? » italique en lévitation au-dessus de l'inconnue x.
   *
   * Toujours actif dès qu'une équation est présente (rhs non vide) et tant
   * que le niveau n'est pas résolu. Pas de dismiss au clic : c'est un repère
   * visuel constant pour rappeler à l'élève « c'est x qu'on cherche ».
   *
   * On vise la première carte avec `data-card-value="x"` ; si elle se déplace
   * (drag, cross-side), le spotlight la suit via un re-measure régulier.
   */
  import { onMount } from "svelte";
  import { game } from "../state/game.svelte.ts";

  let rect = $state<DOMRect | null>(null);
  let resizeObserver: ResizeObserver | null = null;

  const active = $derived(
    !!game.state &&
      game.state.rhs.length > 0 &&
      !game.solved &&
      !game.victoryReady,
  );

  function measure() {
    if (!active) {
      rect = null;
      return;
    }
    const el = document.querySelector<HTMLElement>('[data-card-value="x"]');
    rect = el?.getBoundingClientRect() ?? null;
  }

  $effect(() => {
    void game.state;
    void active;
    requestAnimationFrame(measure);
  });

  onMount(() => {
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  });
</script>

{#if active && rect}
  <div
    class="spotlight"
    style="left: {rect.left + rect.width / 2}px; top: {rect.top - 8}px;"
    aria-hidden="true"
  >
    <span class="mark">?</span>
  </div>
{/if}

<style>
  .spotlight {
    position: fixed;
    z-index: 240;
    transform: translate(-50%, -100%);
    pointer-events: none;
    transition: left 220ms ease-out, top 220ms ease-out;
  }
  .mark {
    display: inline-block;
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 900;
    font-size: 2.25rem;
    color: var(--accent);
    text-shadow:
      0 0 12px rgba(245, 158, 11, 0.6),
      0 2px 8px rgba(0, 0, 0, 0.7);
    animation: levitate 2.4s ease-in-out infinite;
    transform-origin: center;
  }
  @keyframes levitate {
    0%, 100% {
      transform: translateY(0) scale(1) rotate(-4deg);
      filter: drop-shadow(0 8px 6px rgba(0, 0, 0, 0.3));
    }
    50% {
      transform: translateY(-8px) scale(1.07) rotate(4deg);
      filter: drop-shadow(0 14px 6px rgba(0, 0, 0, 0.2));
    }
  }
</style>
