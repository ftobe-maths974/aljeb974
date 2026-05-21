<script lang="ts">
  /**
   * Solution — affichée après résolution d'un niveau à équation (rhs présent).
   *
   * Montre « x = … » avec la valeur rendue en style LaTeX (fractions empilées
   * verticalement). Un bouton « Voir mes étoiles » déclenche l'overlay de
   * récompenses (game.confirmVictory).
   */
  import { game } from "../state/game.svelte.ts";
  import { countBeurks, type Atom, type CardInstance, type FractionInstance } from "../lib/engine/index.ts";
  import { t } from "../i18n/store.svelte.ts";

  /** Renvoie le côté qui CONTIENT la valeur de x (PAS le côté où x est isolé). */
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

  const valueSide = $derived(findValueSide() ?? []);
  /** True ssi la valeur de x contient des simplifications oubliées. */
  const messy = $derived(game.state ? countBeurks(game.state) > 0 : false);

  function atomLabel(a: Atom): string {
    const prefix = a.sign === -1 ? "−" : "";
    if (a.kind === "unknown") return prefix + "x";
    if (a.kind === "hole") return prefix + "?";
    if (a.kind === "literal") return prefix + a.value;
    return prefix + a.letter;
  }

  function rowText(cards: CardInstance[]): string {
    return cards.map((c) => atomLabel(c.atom)).join(" × ");
  }
</script>

<div class="solution" role="dialog" aria-live="polite">
  <p class="title" class:messy>{messy ? t().solution.titleMessy : t().solution.title}</p>
  <div class="equation">
    <span class="x">x</span>
    <span class="equals">=</span>
    <span class="value">
      {#each valueSide as f, i (f.id)}
        {#if i > 0}<span class="plus">+</span>{/if}
        {#if f.denominator && f.denominator.length > 0}
          <span class="frac">
            <span class="num">{rowText(f.numerator)}</span>
            <span class="den">{rowText(f.denominator)}</span>
          </span>
        {:else}
          <span class="single">{rowText(f.numerator)}</span>
        {/if}
      {/each}
    </span>
  </div>
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
    /* Empile titre / équation / bouton en colonne pour que le bouton ne
       finisse pas à côté de .equation (qui est inline-flex). */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
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
  .title.messy {
    /* Couleur un peu plus pâle pour le ton « bof » de la phrase. */
    color: #cbd5e1;
    font-style: italic;
    font-weight: 600;
    font-size: 0.95rem;
  }
  .equation {
    display: inline-flex;
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
  /* Rendu LaTeX de la valeur */
  .value {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--fg);
  }
  .single {
    font-size: 1.6rem;
    padding: 0.1rem 0.4rem;
    border-radius: 0.3rem;
    background: rgba(255, 255, 255, 0.06);
  }
  .frac {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.1;
    padding: 0.15rem 0.4rem;
    border-radius: 0.3rem;
    background: rgba(255, 255, 255, 0.06);
    font-size: 1.3rem;
  }
  .frac .num {
    border-bottom: 2px solid currentColor;
    padding: 0 0.25rem 0.1rem;
  }
  .frac .den {
    padding: 0.1rem 0.25rem 0;
  }
  .plus {
    font-size: 1.5rem;
    opacity: 0.7;
    font-style: normal;
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
