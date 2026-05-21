<script lang="ts">
  import type { Atom, CardInstance } from "../lib/engine/index.ts";
  import { game } from "../state/game.svelte.ts";
  import { drag, draggableCard } from "../state/drag.svelte.ts";

  let {
    card,
    onclick,
    ondblclick: onDoubleClick,
    /** Si défini, active le drag de carte (utilisé pour cartes du dénominateur). */
    parentFractionId,
    onCardDrop,
    /** True quand cette instance est le ghost de drag (rendu dans DragGhost). */
    isGhost = false,
  }: {
    card: CardInstance;
    onclick?: (cardId: string) => void;
    ondblclick?: (cardId: string) => void;
    parentFractionId?: string;
    onCardDrop?: (sourceCardId: string, targetCardId: string | null) => void;
    isGhost?: boolean;
  } = $props();

  const isCardDragSource = $derived(parentFractionId !== undefined);
  const isCardHovered = $derived(
    !isGhost && drag.isCardDrag() && drag.hoverCardId === card.id,
  );
  /** Trou « ! » survolé par un drag de fraction de pioche → highlight. */
  const isHoleHovered = $derived(
    !isGhost && drag.hoverHoleCardId === card.id,
  );
  /** L'effet d'opacité ne s'applique qu'à la carte d'origine, pas au ghost. */
  const isBeingDragged = $derived(
    !isGhost &&
      drag.state?.kind === "card" &&
      drag.state.cardId === card.id,
  );

  const text = $derived(displayText(card.atom));
  const kind = $derived(card.atom.kind);
  const isX = $derived(card.atom.kind === "unknown");
  const isNeg = $derived(card.atom.sign === -1);

  // Le « ? » de spotlight est rendu en enfant de la carte x quand une équation
  // est en cours : il suit ainsi naturellement tout déplacement / transform
  // de la carte (drag, reflow, transition).
  const showSpotlight = $derived(
    isX &&
      card.atom.sign === 1 &&
      !!game.state &&
      game.state.rhs.length > 0 &&
      !game.solved &&
      !game.victoryReady,
  );
  // Valeur sérialisée pour les sélecteurs d'astuces (ex: "x", "-t", "2", "_")
  const dataValue = $derived(serializedValue(card.atom));

  function serializedValue(a: Atom): string {
    const prefix = a.sign === -1 ? "-" : "";
    if (a.kind === "unknown") return prefix + "x";
    if (a.kind === "hole") return prefix + "_";
    if (a.kind === "literal") return prefix + a.value.toString();
    return prefix + a.letter;
  }

  function displayText(a: Atom): string {
    // Trou : on affiche « ! » (un coup à trouver, comme « !! » aux échecs).
    // Le data-card-value reste « _ » pour les sélecteurs d'astuces.
    if (a.kind === "hole") return "!";
    const prefix = a.sign === -1 ? "−" : "";
    if (a.kind === "unknown") return prefix + "x";
    if (a.kind === "literal") return prefix + a.value.toString();
    return prefix + a.letter;
  }

  function handle(e: MouseEvent | KeyboardEvent) {
    if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onclick?.(card.id);
  }

  function handleDoubleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDoubleClick?.(card.id);
  }
</script>

<button
  type="button"
  class="card"
  class:x={isX}
  class:hole={kind === "hole"}
  class:literal={kind === "literal"}
  class:symbol={kind === "symbol"}
  class:neg={isNeg}
  class:card-hovered={isCardHovered}
  class:card-dragging={isBeingDragged}
  class:hole-hovered={isHoleHovered}
  data-card-id={card.id}
  data-card-value={dataValue}
  onclick={handle}
  ondblclick={handleDoubleClick}
  onkeydown={handle}
  aria-label={text}
  use:draggableCard={
    isCardDragSource
      ? {
          cardId: card.id,
          parentFractionId: parentFractionId!,
          onDrop: (targetCardId) => onCardDrop?.(card.id, targetCardId),
        }
      : null
  }
>
  <span class="value">{text}</span>
  {#if showSpotlight}
    <span class="x-spotlight" aria-hidden="true">?</span>
  {/if}
</button>

<style>
  .card {
    --size: clamp(2.5rem, 8vh, 4rem);
    position: relative;
    width: var(--size);
    height: var(--size);
    border-radius: 0.5rem;
    border: 2px solid rgba(0, 0, 0, 0.15);
    background: var(--card-bg, #ffffff);
    color: var(--card-fg, #0f1722);
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 700;
    font-size: calc(var(--size) * 0.5);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 100ms ease-out, box-shadow 100ms ease-out;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  /* « ? » de spotlight attaché à la carte x (suit tout son mouvement).
     Positionné juste au-dessus du bord supérieur, avec un léger chevauchement. */
  .x-spotlight {
    position: absolute;
    top: -0.55em;
    left: 50%;
    transform: translateX(-50%);
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 900;
    font-size: 1em;
    line-height: 1;
    color: var(--accent);
    text-shadow:
      0 0 10px rgba(245, 158, 11, 0.55),
      0 2px 6px rgba(0, 0, 0, 0.65);
    pointer-events: none;
    animation: x-levitate 2.4s ease-in-out infinite;
    transform-origin: center;
  }
  @keyframes x-levitate {
    0%, 100% {
      transform: translate(-50%, 0) scale(1) rotate(-4deg);
    }
    50% {
      transform: translate(-50%, -4px) scale(1.06) rotate(4deg);
    }
  }
  .card:hover,
  .card:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
    outline: none;
  }
  .card:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  /* Inconnue : dégradé pulsant pour l'identifier en un coup d'œil */
  .card.x {
    background: linear-gradient(135deg, #f59e0b, #fb923c);
    color: #ffffff;
    animation: x-pulse 3s ease-in-out infinite;
  }
  @keyframes x-pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
    }
  }

  .card.literal { background: #f8fafc; }
  .card.symbol { background: #e2e8f0; }
  .card.hole {
    background: transparent;
    border: 2px dashed rgba(255, 255, 255, 0.5);
    color: rgba(255, 255, 255, 0.55);
    /* Le « ! » est en gras italique pour ressembler à une notation d'échec. */
    font-weight: 900;
  }
  /* Survol par un drag de pioche : highlight orange. */
  .card.hole.hole-hovered {
    border-color: var(--accent);
    background: rgba(245, 158, 11, 0.18);
    color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent), 0 0 18px rgba(245, 158, 11, 0.6);
    transform: scale(1.08);
  }

  /* Marqueur visuel pour les négatifs */
  .card.neg {
    background: #fed7aa;
  }
  .card.neg.x {
    background: linear-gradient(135deg, #ea580c, #9a3412);
  }

  /* Highlight quand la carte est cible d'un drag-carte (simplification) */
  .card.card-hovered {
    box-shadow: 0 0 0 3px var(--accent), 0 6px 14px rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
  /* La carte qui est draguée s'estompe sur place */
  .card.card-dragging {
    opacity: 0.25;
  }
</style>
