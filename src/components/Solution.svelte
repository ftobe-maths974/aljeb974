<script lang="ts">
  /**
   * Solution — affiché après résolution d'un niveau à équation (rhs présent).
   *
   * Montre « x = … » dérivé du côté qui ne contient pas x, et un bouton
   * « Voir mes étoiles » qui déclenche l'overlay de récompenses.
   *
   * Format : on rend la valeur avec serializeTerm sur chaque terme, joint
   * par des « + » (les signes négatifs internes sont déjà encodés par
   * l'opérateur unaire dans le DSL — ex: « -t » s'affiche tel quel).
   */
  import { game } from "../state/game.svelte.ts";
  import { serializeTerm, type FractionInstance } from "../lib/engine/index.ts";
  import { t } from "../i18n/store.svelte.ts";

  /** Renvoie le côté qui CONTIENT la valeur de x (donc PAS le côté où x est isolé). */
  function findValueSide(): FractionInstance[] | null {
    const s = game.state;
    if (!s) return null;
    const xIsAloneOn = (side: FractionInstance[]) =>
      side.length === 1 &&
      side[0]!.numerator.length === 1 &&
      !side[0]!.denominator &&
      side[0]!.numerator[0]!.atom.kind === "unknown" &&
      side[0]!.numerator[0]!.atom.sign === 1;
    if (xIsAloneOn(s.lhs)) return s.rhs;
    if (xIsAloneOn(s.rhs)) return s.lhs;
    return null;
  }

  const valueText = $derived.by(() => {
    const side = findValueSide();
    if (!side || side.length === 0) return "?";
    return side
      .map((f) =>
        serializeTerm({
          numerator: f.numerator.map((c) => c.atom),
          denominator: f.denominator?.map((c) => c.atom),
        }),
      )
      // Joindre par + ; transforme « + -X » en « − X » pour la lecture
      .join(" + ")
      .replace(/\s\+\s-/g, " − ");
  });
</script>

<div class="solution" role="dialog" aria-live="polite">
  <p class="title">{t().solution.title}</p>
  <p class="equation">
    <span class="x">x</span>
    <span class="equals">=</span>
    <span class="value">{valueText}</span>
  </p>
  <button class="confirm" onclick={() => game.confirmVictory()}>
    {t().solution.confirm}
  </button>
</div>

<style>
  .solution {
    position: absolute;
    left: 50%;
    bottom: 1.5rem;
    transform: translateX(-50%);
    background: rgba(15, 23, 34, 0.96);
    border: 2px solid var(--accent);
    border-radius: 1rem;
    padding: 1rem 1.5rem;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
    z-index: 80;
    animation: solution-pop 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
    max-width: 90vw;
  }
  @keyframes solution-pop {
    0%   { transform: translate(-50%, 16px); opacity: 0; }
    100% { transform: translate(-50%, 0);    opacity: 1; }
  }
  .title {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: var(--accent);
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .equation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 0 0 0.85rem;
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 700;
  }
  .x {
    font-size: 2rem;
    background: linear-gradient(135deg, #f59e0b, #fb923c);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .equals {
    font-size: 1.75rem;
    color: var(--fg);
    opacity: 0.85;
  }
  .value {
    font-size: 1.5rem;
    color: var(--fg);
    padding: 0.1rem 0.5rem;
    border-radius: 0.35rem;
    background: rgba(255, 255, 255, 0.06);
  }
  .confirm {
    background: var(--accent);
    color: var(--bg);
    padding: 0.6rem 1.25rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.95rem;
    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.4);
    transition: transform 120ms;
  }
  .confirm:hover {
    transform: translateY(-1px) scale(1.03);
  }
  .confirm:active {
    transform: translateY(0) scale(1);
  }
</style>
