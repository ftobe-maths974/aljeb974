<script lang="ts">
  /**
   * SandboxControls — barre d'outils de la banque (sandbox). Deux boutons qui
   * « poppent » au-dessus de la pioche :
   *  - 🧪 Pouvoirs : prompt d'équation + interrupteurs de superpouvoirs.
   *  - 🎴 Cartes   : palette de tous les nombres/lettres (uniques) à ajouter
   *                  dans la banque. Rendu via Card → respecte le thème.
   */
  import { sandbox, SANDBOX_POWERS } from "../state/sandbox.svelte.ts";
  import { i18n } from "../i18n/store.svelte.ts";
  import { game } from "../state/game.svelte.ts";
  import { sandboxPioche } from "../data/bonus.ts";
  import { parseEquation, ParseError } from "../lib/parseEquation.ts";
  import { SYMBOL_LETTERS, serializeAtom, type Atom, type CardInstance } from "../lib/engine/index.ts";
  import Card from "./Card.svelte";

  let panel = $state<null | "powers" | "palette">(null);
  const lang = $derived(i18n.locale === "en" ? "en" : "fr");

  let equation = $state("x + 6 + a = b - 3 + 2/p");
  let error = $state<string | null>(null);

  function loadEquation() {
    error = null;
    try {
      const { lhs, rhs } = parseEquation(equation);
      game.loadSandbox({ lhs, rhs, pioche: sandboxPioche, shots: 999 });
      panel = null;
    } catch (e) {
      error = e instanceof ParseError ? e.message : "Équation invalide.";
    }
  }

  // Palette : nombres 0–9 + inconnue x + lettres autorisées.
  const paletteAtoms: Atom[] = [
    ...Array.from({ length: 10 }, (_, i) => ({ kind: "literal", sign: 1, value: i }) as Atom),
    { kind: "unknown", sign: 1 },
    ...SYMBOL_LETTERS.map((l) => ({ kind: "symbol", sign: 1, letter: l }) as Atom),
  ];
  function ci(atom: Atom): CardInstance {
    return { id: `pal-${serializeAtom(atom)}`, atom };
  }
</script>

<div class="bank-tools">
  <button class="tool" class:active={panel === "powers"} onclick={() => (panel = panel === "powers" ? null : "powers")}>
    <span aria-hidden="true">🧪</span><span>{lang === "en" ? "Powers" : "Pouvoirs"}</span>
  </button>
  <button class="tool" class:active={panel === "palette"} onclick={() => (panel = panel === "palette" ? null : "palette")}>
    <span aria-hidden="true">🎴</span><span>{lang === "en" ? "Cards" : "Cartes"}</span>
  </button>

  {#if panel}
    <button class="backdrop" aria-label="Fermer" onclick={() => (panel = null)}></button>
  {/if}

  {#if panel === "powers"}
    <div class="pop powers" role="dialog">
      <div class="prompt">
        <input
          type="text"
          bind:value={equation}
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          placeholder="a/b + 3x = 5 - x"
          onkeydown={(e) => e.key === "Enter" && loadEquation()}
        />
        <button class="load" onclick={loadEquation}>{lang === "en" ? "Load" : "Charger"}</button>
      </div>
      {#if error}<p class="err">{error}</p>{/if}
      <div class="sep"></div>
      <div class="powerlist">
        {#each SANDBOX_POWERS as p (p.key)}
          <button
            class="pw"
            class:on={sandbox.powers[p.key]}
            role="switch"
            aria-checked={sandbox.powers[p.key]}
            onclick={() => sandbox.toggle(p.key)}
          >
            <span class="sw" aria-hidden="true"></span>
            <span class="lbl">{p.label[lang]}</span>
          </button>
        {/each}
        <button class="reset" onclick={() => sandbox.reset()}>↺ {lang === "en" ? "Reset" : "Défaut"}</button>
      </div>
    </div>
  {/if}

  {#if panel === "palette"}
    <div class="pop palette" role="dialog">
      <p class="hint">{lang === "en" ? "Tap to add/remove in the bank" : "Touche pour ajouter/retirer dans la banque"}</p>
      <div class="grid">
        {#each paletteAtoms as atom (serializeAtom(atom))}
          <div class="pal" class:on={game.piocheHas(atom)}>
            <Card card={ci(atom)} onclick={() => game.togglePiocheItem(atom)} />
            {#if game.piocheHas(atom)}<span class="badge" aria-hidden="true">✓</span>{/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .bank-tools {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex-shrink: 0;
    z-index: 5;
  }
  .tool {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.6rem;
    border-radius: 0.55rem;
    color: var(--fg);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
    transition: background 120ms, border-color 120ms;
  }
  .tool:hover { background: rgba(255, 255, 255, 0.16); }
  .tool.active { border-color: var(--accent); background: rgba(245, 158, 11, 0.16); }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
    background: transparent;
    border: 0;
  }
  /* Popovers : s'ouvrent VERS LE HAUT (la banque est en bas). */
  .pop {
    position: absolute;
    bottom: calc(100% + 0.5rem);
    left: 0;
    z-index: 20;
    border-radius: 0.8rem;
    background: rgba(20, 28, 40, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.5);
    padding: 0.65rem;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .powers { width: min(20rem, 84vw); max-height: 60vh; overflow-y: auto; }
  .palette { width: min(24rem, 90vw); max-height: 56vh; overflow-y: auto; }

  .prompt { display: flex; gap: 0.3rem; }
  .prompt input {
    flex: 1; min-width: 0;
    background: rgba(255, 255, 255, 0.08);
    color: var(--fg);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.4rem;
    padding: 0.4rem 0.45rem;
    font-size: 0.8rem;
    font-family: ui-monospace, monospace;
  }
  .prompt input:focus { outline: none; border-color: var(--accent); }
  .prompt .load {
    flex-shrink: 0; background: var(--accent); color: var(--bg);
    border-radius: 0.4rem; padding: 0.4rem 0.6rem; font-size: 0.78rem; font-weight: 700;
  }
  .err { margin: 0.35rem 0 0; color: #fca5a5; font-size: 0.74rem; line-height: 1.3; }
  .sep { height: 1px; background: rgba(255, 255, 255, 0.1); margin: 0.55rem 0; }

  .powerlist { display: flex; flex-direction: column; gap: 0.2rem; }
  .pw {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.35rem 0.4rem; border-radius: 0.45rem;
    color: var(--fg); text-align: left; font-size: 0.8rem; opacity: 0.7;
    transition: background 120ms, opacity 120ms;
  }
  .pw:hover { background: rgba(255, 255, 255, 0.06); }
  .pw.on { opacity: 1; }
  .sw {
    position: relative; flex-shrink: 0; width: 1.7rem; height: 0.95rem;
    border-radius: 999px; background: rgba(255, 255, 255, 0.15); transition: background 140ms;
  }
  .sw::after {
    content: ""; position: absolute; top: 0.1rem; left: 0.1rem;
    width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #cbd5e1;
    transition: transform 140ms, background 140ms;
  }
  .pw.on .sw { background: var(--accent); }
  .pw.on .sw::after { transform: translateX(0.75rem); background: #fff; }
  .reset {
    margin-top: 0.3rem; align-self: flex-start; color: var(--fg); opacity: 0.6;
    font-size: 0.76rem; padding: 0.25rem 0.4rem; border-radius: 0.4rem;
  }
  .reset:hover { opacity: 1; background: rgba(255, 255, 255, 0.08); }

  .palette .hint { margin: 0 0 0.5rem; font-size: 0.74rem; opacity: 0.6; }
  .grid {
    --card-size: 2.3rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(2.5rem, 1fr));
    gap: 0.4rem;
  }
  .pal {
    position: relative;
    display: inline-flex;
    justify-content: center;
    border-radius: 0.5rem;
    transition: opacity 120ms;
    opacity: 0.55;
  }
  .pal.on { opacity: 1; }
  .pal .badge {
    position: absolute;
    top: -0.3rem;
    right: -0.3rem;
    width: 1.05rem;
    height: 1.05rem;
    border-radius: 50%;
    background: var(--accent);
    color: var(--bg);
    font-size: 0.7rem;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  }
</style>
