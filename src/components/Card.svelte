<script lang="ts">
  import type { Atom, CardInstance } from "../lib/engine/index.ts";
  import { shouldRevealAsText } from "../lib/engine/index.ts";
  import { game } from "../state/game.svelte.ts";
  import { drag, draggableCard } from "../state/drag.svelte.ts";
  import { cardForm } from "../features/card-form/store.svelte.ts";
  import { emojiFor } from "../features/card-form/emoji.ts";

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
      !!game.state &&
      !game.solved &&
      !game.victoryReady,
  );
  // Valeur sérialisée pour les sélecteurs d'astuces (ex: "x", "-t", "2", "_")
  const dataValue = $derived(serializedValue(card.atom));

  // ─── Forme de la carte : texte / image / emoji (feature card-form) ──────────
  // Le `reveal` du niveau (game.revealSet) décide si une carte est dévoilée
  // (texte) ou « cachée » (sprite). Le mode « text » force tout en texte.
  const isHole = $derived(card.atom.kind === "hole");
  const absValue = $derived(dataValue.replace(/^-/, ""));
  /** Un PNG legacy existe pour les lettres a–z et chiffres 0–9 (signe inclus). */
  const spriteUrl = $derived(
    /^-?([a-z]|[0-9])$/.test(dataValue)
      ? `${import.meta.env.BASE_URL}cartes/${dataValue}.png`
      : null,
  );
  const emojiGlyph = $derived(emojiFor(absValue));
  const revealedAsText = $derived(
    isHole ||
      cardForm.value === "text" ||
      shouldRevealAsText(card.atom, game.revealSet),
  );
  /** Mode de rendu effectif, avec repli sur "text" si l'asset manque. */
  const renderMode = $derived.by<"text" | "image" | "emoji">(() => {
    if (revealedAsText) return "text";
    if (cardForm.value === "image" && spriteUrl) return "image";
    if (cardForm.value === "emoji" && emojiGlyph) return "emoji";
    return "text";
  });

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
  class:sprite-image={renderMode === "image"}
  class:sprite-emoji={renderMode === "emoji"}
  class:card-hovered={isCardHovered}
  class:card-dragging={isBeingDragged}
  class:hole-hovered={isHoleHovered}
  data-card-id={card.id}
  data-card-value={dataValue}
  style={renderMode === "image" && spriteUrl
    ? `background-image: url(${spriteUrl})`
    : undefined}
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
  {#if renderMode === "image"}
    <!-- sprite legacy : l'image est en background, pas de glyphe texte -->
  {:else if renderMode === "emoji"}
    <span class="value emoji">{emojiGlyph}</span>
  {:else}
    <span class="value">{text}</span>
  {/if}
  {#if showSpotlight}
    <span class="x-spotlight" aria-hidden="true">?</span>
  {/if}
</button>

<style>
  .card {
    /* Surcharge possible par un ancêtre via --card-size (ex: Solution). */
    --size: var(--card-size, clamp(2.5rem, 8vh, 4rem));
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

  /* Inconnue : dégradé + halo flamboyant qui « respire » très lentement, pour
     l'identifier en un coup d'œil (le dragon brille). */
  .card.x {
    background: linear-gradient(135deg, #f59e0b, #fb923c);
    color: #ffffff;
    animation: x-glow 4.5s ease-in-out infinite;
  }
  @keyframes x-glow {
    0%, 100% {
      box-shadow:
        0 0 7px 1px rgba(245, 158, 11, 0.45),
        0 0 15px 3px rgba(251, 146, 60, 0.22);
    }
    50% {
      box-shadow:
        0 0 15px 4px rgba(245, 158, 11, 0.75),
        0 0 30px 9px rgba(251, 146, 60, 0.45);
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

  /* Marqueur visuel pour les négatifs.
     Le rendu est piloté par le contrat de variables de la feature
     opposite-scheme (src/features/opposite-scheme/schemes.ts). Les fallbacks
     reproduisent le look « couleur » historique : sans schéma actif, rien ne
     change. */
  .card.neg {
    background: var(--opp-neg-bg, #fed7aa);
    border-color: var(--opp-neg-border-color, rgba(0, 0, 0, 0.15));
  }
  .card.neg.x {
    background: var(--opp-neg-x-bg, linear-gradient(135deg, #ea580c, #9a3412));
  }
  /* Overlay dédié à l'ombre « creuse » (inset) : indépendant du box-shadow de
     la carte pour ne pas entrer en conflit avec le survol. */
  .card.neg::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: var(--opp-neg-shadow, none);
    pointer-events: none;
  }
  .value {
    display: inline-block;
  }
  /* Opposé sur glyphe TEXTE : couleur / contour / transform. */
  .card.neg .value:not(.emoji) {
    color: var(--opp-neg-fg, inherit);
    -webkit-text-stroke: var(--opp-neg-stroke, 0);
    transform: var(--opp-neg-transform, none);
  }
  /* Opposé sur EMOJI : filtre (les vars couleur/contour n'agissent pas dessus). */
  .card.neg .value.emoji {
    filter: var(--opp-neg-filter, none);
    transform: var(--opp-neg-transform, none);
  }

  /* ─── Forme « sprite » (feature card-form) ──────────────────────────────── */
  .value.emoji {
    font-style: normal;
    font-size: calc(var(--size) * 0.6);
    -webkit-text-stroke: 0;
    line-height: 1;
  }
  /* Mode image : sprite PNG legacy en fond, remplit la carte bord à bord
     (comme le legacy : background-size 100% 100%, pas de marge / frise). */
  .card.sprite-image {
    background-color: #ffffff;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
  }
  /* L'asset encode déjà le signe → on neutralise l'effet d'opposé en mode image. */
  .card.sprite-image.neg {
    background-color: #ffffff;
  }
  .card.sprite-image.neg::after {
    box-shadow: none;
  }
  .card.sprite-image.x {
    animation: none;
  }
  /* Mode emoji : l'opposé agit sur l'EMOJI (filtre / retournement), pas sur le
     fond. On garde donc un fond clair côté négatif pour que l'emoji reste
     visible (sinon un emoji inversé sur fond sombre disparaît). */
  /* Fond blanc uniforme (positif comme négatif) : l'opposé se lit sur l'emoji
     (filtre / retournement), pas sur le fond. L'inconnue x garde son dégradé. */
  .card.sprite-emoji:not(.x) {
    background: #ffffff;
  }
  /* Opposé du dragon (−x) en emoji : « dragon d'ombre » — même dragon, fond
     sombre + lueur froide (bleu/violet) au lieu du halo flamboyant. */
  .card.sprite-emoji.neg.x {
    background: linear-gradient(135deg, #312e81, #0b1020);
    border-color: rgba(148, 163, 233, 0.3);
    animation: x-glow-cold 4.5s ease-in-out infinite;
  }
  /* Le dragon garde ses couleurs (pas de filtre/retournement du schéma). */
  .card.sprite-emoji.neg.x .value.emoji {
    filter: none;
    transform: none;
  }
  @keyframes x-glow-cold {
    0%, 100% {
      box-shadow:
        0 0 7px 1px rgba(99, 102, 241, 0.45),
        0 0 15px 3px rgba(139, 92, 246, 0.22);
    }
    50% {
      box-shadow:
        0 0 15px 4px rgba(99, 102, 241, 0.78),
        0 0 30px 9px rgba(139, 92, 246, 0.45);
    }
  }
  .card.sprite-emoji.neg::after {
    box-shadow: none;
  }
  /* Chiffres (dés) : opposition portée par le FOND — positif sur blanc,
     opposé sur fond noir (négatif photo), l'emoji reste blanc (pas de filtre). */
  .card.sprite-emoji.neg.literal {
    background: #0f1722;
    border-color: rgba(255, 255, 255, 0.25);
  }
  /* L'emoji dé a une face transparente : on l'inverse pour que contour + points
     passent en blanc sur le fond noir (vrai négatif photo). */
  .card.sprite-emoji.neg.literal .value.emoji {
    filter: invert(1);
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
