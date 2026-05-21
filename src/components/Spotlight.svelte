<script lang="ts">
  /**
   * Spotlight — un « ? » en lévitation au-dessus d'une carte cible.
   *
   * Activé pour les niveaux-clés ayant un champ `spotlight` (cf. key-levels.ts).
   * Persiste jusqu'au premier pointerdown du joueur, comme la LevelIntro.
   *
   * La cible est résolue côté DOM via le sélecteur calculé depuis l'AtomQuery.
   */
  import { onMount } from "svelte";
  import { game } from "../state/game.svelte.ts";
  import { getKeyLevel } from "../data/key-levels.ts";
  import { astuceSelector } from "../data/astuces.ts";

  let rect = $state<DOMRect | null>(null);
  let dismissed = $state(false);
  let onceHandler: ((e: Event) => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const activeQuery = $derived(() => {
    const id = `${game.chapter}-${game.level}`;
    const kl = getKeyLevel(id);
    return kl?.spotlight ?? null;
  });

  function measure() {
    const q = activeQuery();
    if (!q) {
      rect = null;
      return;
    }
    const el = document.querySelector<HTMLElement>(astuceSelector(q));
    rect = el?.getBoundingClientRect() ?? null;
  }

  $effect(() => {
    // Re-évalue à chaque changement de niveau et d'état (cartes bougent)
    void game.state;
    void game.chapter;
    void game.level;
    dismissed = false;
    // léger délai pour laisser le DOM se rendre
    requestAnimationFrame(measure);
  });

  onMount(() => {
    // Ferme au premier geste du joueur
    onceHandler = () => {
      dismissed = true;
    };
    setTimeout(() => {
      if (onceHandler) {
        window.addEventListener("pointerdown", onceHandler, { passive: true });
      }
    }, 300);

    // Suit les changements de layout (resize, reflow)
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      if (onceHandler) window.removeEventListener("pointerdown", onceHandler);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  });
</script>

{#if rect && !dismissed && activeQuery()}
  <div
    class="spotlight"
    style="left: {rect.left + rect.width / 2}px; top: {rect.top - 12}px;"
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
  }
  .mark {
    display: inline-block;
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 900;
    font-size: 2.5rem;
    color: var(--accent);
    text-shadow:
      0 0 12px rgba(245, 158, 11, 0.6),
      0 2px 8px rgba(0, 0, 0, 0.7);
    animation: levitate 2.2s ease-in-out infinite;
    transform-origin: center;
  }
  @keyframes levitate {
    0%, 100% {
      transform: translateY(0) scale(1) rotate(-3deg);
      filter: drop-shadow(0 8px 6px rgba(0, 0, 0, 0.3));
    }
    50% {
      transform: translateY(-10px) scale(1.08) rotate(3deg);
      filter: drop-shadow(0 14px 6px rgba(0, 0, 0, 0.2));
    }
  }
</style>
