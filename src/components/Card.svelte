<script lang="ts">
  import type { Atom, CardInstance } from "../lib/engine/index.ts";

  let {
    card,
    onclick,
  }: {
    card: CardInstance;
    onclick?: (cardId: string) => void;
  } = $props();

  const text = $derived(displayText(card.atom));
  const kind = $derived(card.atom.kind);
  const isX = $derived(card.atom.kind === "unknown");
  const isNeg = $derived(card.atom.sign === -1);

  function displayText(a: Atom): string {
    if (a.kind === "hole") return "?";
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
</script>

<button
  type="button"
  class="card"
  class:x={isX}
  class:hole={kind === "hole"}
  class:literal={kind === "literal"}
  class:symbol={kind === "symbol"}
  class:neg={isNeg}
  data-card-id={card.id}
  onclick={handle}
  onkeydown={handle}
  aria-label={text}
>
  <span class="value">{text}</span>
</button>

<style>
  .card {
    --size: clamp(2.5rem, 8vh, 4rem);
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
    color: rgba(255, 255, 255, 0.6);
  }

  /* Marqueur visuel pour les négatifs */
  .card.neg {
    background: #fed7aa;
  }
  .card.neg.x {
    background: linear-gradient(135deg, #ea580c, #9a3412);
  }
</style>
