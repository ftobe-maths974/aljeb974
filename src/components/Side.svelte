<script lang="ts">
  import type { FractionInstance, Side as SideName } from "../lib/engine/index.ts";
  import Fraction from "./Fraction.svelte";
  import DropZone from "./DropZone.svelte";
  import { drag } from "../state/drag.svelte.ts";
  import { game } from "../state/game.svelte.ts";
  import { serializeTerm } from "../lib/engine/index.ts";

  let {
    fractions,
    name,
    onCardClick,
    onCardDoubleClick,
    onDrop,
    onCardDrop,
  }: {
    fractions: FractionInstance[];
    name: SideName;
    onCardClick?: (cardId: string) => void;
    onCardDoubleClick?: (cardId: string) => void;
    onDrop?: (sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs"; holeCardId?: string; divideZone?: boolean; multiplyZone?: boolean }) => void;
    onCardDrop?: (sourceCardId: string, targetCardId: string | null) => void;
  } = $props();

  const isHoveredSide = $derived(
    drag.isDragging() &&
      (name === "lhs" || name === "rhs") &&
      drag.hoverSide === name &&
      drag.hoverFractionId === null,
  );

  // Drop zone à afficher si on est en pending et que ce côté est encore à servir
  const pendingTarget = $derived(
    (name === "lhs" || name === "rhs") &&
      game.state?.pending?.remainingTargets.includes(name as "lhs" | "rhs"),
  );
  const pendingSummary = $derived(
    game.state?.pending ? serializeTerm(game.state.pending.cardToInsert) : "",
  );

  /**
   * Bascule verticale du membre quand un drop a été posé d'un seul côté.
   * - Côté qui a déjà reçu la carte (absent de remainingTargets) → +TILT (descend)
   * - Côté qui attend encore (dans remainingTargets)             → -TILT (monte)
   * - Pas de pending                                              →   0
   */
  const TILT = 16;
  const tilt = $derived.by(() => {
    const p = game.state?.pending;
    if (!p) return 0;
    if (name !== "lhs" && name !== "rhs") return 0;
    const heavy = !p.remainingTargets.includes(name as "lhs" | "rhs");
    const light = p.remainingTargets.includes(name as "lhs" | "rhs");
    return heavy ? TILT : light ? -TILT : 0;
  });

  // Le plateau de balance est visible dès qu'une équation est présente
  // (donc même sur le membre gauche : il existe un membre droit).
  const showPlatter = $derived(
    (name === "lhs" || name === "rhs") &&
      (game.state?.rhs.length ?? 0) > 0,
  );

  // Scale auto pour tenir sur une seule ligne (pas de wrap).
  // lhs/rhs partagent le MÊME scale (le plus petit des deux) → toutes les cartes
  // de l'équation ont la même taille, sur la largeur totale. La pioche garde le
  // sien.
  import { onMount, onDestroy } from "svelte";
  import { balanceScale } from "../state/balanceScale.svelte.ts";
  let contentEl: HTMLDivElement | undefined = $state();
  let needed = $state(1); // scale nécessaire pour CE côté
  function measure() {
    if (!contentEl) return;
    const parent = contentEl.parentElement;
    if (!parent) return;
    // Largeur disponible = largeur du side moins padding horizontal (2 × 0.75rem).
    const avail = parent.clientWidth - parseFloat(getComputedStyle(parent).paddingLeft) * 2;
    // scrollWidth = largeur naturelle (transform:scale n'affecte pas le layout).
    const natural = contentEl.scrollWidth;
    needed = natural > avail && natural > 0 ? Math.max(0.3, avail / natural) : 1;
  }
  // Échelle appliquée : pioche = la sienne ; lhs/rhs = la plus petite des deux.
  const appliedScale = $derived(
    name === "pioche" ? needed : Math.min(balanceScale.lhs, balanceScale.rhs),
  );
  // Publie le scale nécessaire de ce côté dans le store partagé.
  $effect(() => {
    if (name === "lhs") balanceScale.lhs = needed;
    else if (name === "rhs") balanceScale.rhs = needed;
  });
  onDestroy(() => {
    // Côté démonté (niveau sans équation) → ne doit plus contraindre le min.
    if (name === "lhs") balanceScale.lhs = 1;
    else if (name === "rhs") balanceScale.rhs = 1;
  });
  // Applique le scale (réactif : se met à jour si l'AUTRE côté change le min).
  $effect(() => {
    if (contentEl) contentEl.style.transform = `scale(${appliedScale})`;
  });
  // Re-mesure quand l'état change.
  $effect(() => {
    void game.state;
    requestAnimationFrame(measure);
  });
  onMount(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (contentEl?.parentElement) ro.observe(contentEl.parentElement);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  });
</script>

<div
  class="side"
  class:lhs={name === "lhs"}
  class:rhs={name === "rhs"}
  class:pioche={name === "pioche"}
  class:hovered={isHoveredSide}
  data-side={name}
  style="transform: translateY({tilt}px);"
>
  <!-- .content : ligne unique sans wrap, scalée pour tenir dans le side. -->
  <div class="content" bind:this={contentEl}>
    {#each fractions as fraction, i (fraction.id)}
      {#if i > 0 && name !== "pioche"}
        <span class="plus" aria-hidden="true">+</span>
      {/if}
      <Fraction {fraction} {onCardClick} {onCardDoubleClick} {onDrop} {onCardDrop} />
    {/each}
    {#if pendingTarget}
      {#if fractions.length > 0}
        <span class="plus" aria-hidden="true">+</span>
      {/if}
      <DropZone side={name as "lhs" | "rhs"} cardSummary={pendingSummary} />
    {/if}
  </div>
  {#if showPlatter}
    <div class="platter" aria-hidden="true"></div>
  {/if}
</div>

<style>
  .side {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    border-radius: 0.75rem;
    background: var(--side-bg);
    border: 1px solid var(--side-border);
    min-height: 8rem;
    /* Spring/ressort pour la bascule de la balance */
    transition:
      transform 650ms cubic-bezier(0.34, 1.56, 0.64, 1),
      background 120ms, border-color 120ms, box-shadow 120ms;
    will-change: transform;
  }
  /* .content : ligne unique non-wrapée. Scalée par JS pour tenir dans le side.
     Pas d'overflow:hidden sur .side pour que .platter (bottom: -14px) reste
     visible ; le transform:scale shrink visuellement le contenu pour qu'il
     tienne dans .side même si sa largeur naturelle dépasse. */
  .content {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    transform-origin: center center;
    transition: transform 180ms ease-out;
    white-space: nowrap;
  }
  .lhs, .rhs {
    flex: 1;
    /* Autorise le côté à rétrécir sous la largeur de son contenu (nowrap),
       sinon il déborde au lieu de laisser le scale auto (recomputeScale) agir. */
    min-width: 0;
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
  /* Plateau de balance : attaché en bas du membre, suit donc sa bascule. */
  .platter {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -14px;
    height: 8px;
    background: rgba(241, 245, 249, 0.55);
    border-radius: 999px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
    pointer-events: none;
  }
</style>
