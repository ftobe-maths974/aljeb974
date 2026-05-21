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
    onDrop,
  }: {
    fractions: FractionInstance[];
    name: SideName;
    onCardClick?: (cardId: string) => void;
    onDrop?: (sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs" }) => void;
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
  {#each fractions as fraction, i (fraction.id)}
    {#if i > 0 && name !== "pioche"}
      <span class="plus" aria-hidden="true">+</span>
    {/if}
    <Fraction {fraction} {onCardClick} {onDrop} />
  {/each}
  {#if pendingTarget}
    {#if fractions.length > 0}
      <span class="plus" aria-hidden="true">+</span>
    {/if}
    <DropZone side={name as "lhs" | "rhs"} cardSummary={pendingSummary} />
  {/if}
  {#if showPlatter}
    <div class="platter" aria-hidden="true"></div>
  {/if}
</div>

<style>
  .side {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    /* center : cartes et fractions partagent leur centre vertical
       (les fractions s'étirent symétriquement autour, les cartes solitaires
       sont au milieu). */
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
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
  .lhs, .rhs {
    flex: 1;
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
