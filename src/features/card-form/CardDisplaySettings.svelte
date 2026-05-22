<script lang="ts">
  import { i18n } from "../../i18n/store.svelte.ts";
  import { oppositeScheme } from "../opposite-scheme/store.svelte.ts";
  import { OPPOSITE_SCHEMES, schemeStyle, type OppositeScheme } from "../opposite-scheme/schemes.ts";
  import { cardForm, CARD_FORMS, type CardForm } from "./store.svelte.ts";
  import { emojiFor } from "./emoji.ts";

  let open = $state(false);
  const lang = $derived(i18n.locale === "en" ? "en" : "fr");

  /** Téléporte l'overlay sur <body> pour échapper aux contextes d'empilement /
   *  blocs englobants (topbar backdrop-filter…) → vraie modale plein écran. */
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.parentNode?.removeChild(node);
      },
    };
  }
  /** L'axe « opposés » ne change rien en mode image (l'asset encode le signe). */
  const oppositeApplies = $derived(cardForm.value !== "image");

  function labelOf(s: OppositeScheme): string {
    return s.label[lang as "fr" | "en"];
  }
  function descOf(s: OppositeScheme): string {
    return s.description[lang as "fr" | "en"];
  }
</script>

<div class="settings">
  <button
    class="trigger"
    onclick={() => (open = !open)}
    aria-expanded={open}
    aria-label={lang === "en" ? "Card display" : "Affichage des cartes"}
    title={lang === "en" ? "Card display" : "Affichage des cartes"}
  >
    <span aria-hidden="true">⚙︎</span>
  </button>

  {#if open}
    <div class="overlay" use:portal>
    <button
      class="backdrop"
      aria-label={lang === "en" ? "Close" : "Fermer"}
      onclick={() => (open = false)}
    ></button>
    <div class="panel" role="dialog" aria-label={lang === "en" ? "Card display" : "Affichage des cartes"}>
      <!-- ─── Axe B : forme des cartes ─────────────────────────────────────── -->
      <h3>{lang === "en" ? "Card form" : "Forme des cartes"}</h3>
      <div class="forms" role="group">
        {#each CARD_FORMS as f (f.id)}
          <button
            class="form"
            class:active={cardForm.value === f.id}
            onclick={() => cardForm.set(f.id as CardForm)}
          >
            <span class="form-demo" aria-hidden="true">
              {#if f.id === "image"}
                <span class="demo-card" style="background-image: url({import.meta.env.BASE_URL}cartes/x.png)"></span>
              {:else if f.id === "emoji"}
                <span class="demo-card emojicard">{emojiFor("x")}</span>
              {:else}
                <span class="demo-card x"><span class="value">x</span></span>
              {/if}
            </span>
            <span class="form-label">{f.label[lang as "fr" | "en"]}</span>
          </button>
        {/each}
      </div>
      <p class="hint">
        {lang === "en"
          ? "Images and emoji follow each level’s reveal (hidden cards become symbols as you progress)."
          : "Images et emoji suivent le « reveal » de chaque niveau (les cartes cachées deviennent des symboles au fil de la progression)."}
      </p>

      <!-- ─── Axe A : représentation des opposés ───────────────────────────── -->
      <h3 class:dimmed={!oppositeApplies}>
        {lang === "en" ? "Opposites" : "Opposés"}
        {#if !oppositeApplies}
          <span class="tag">{lang === "en" ? "n/a in image mode" : "sans effet en mode image"}</span>
        {/if}
      </h3>
      <ul class:dimmed={!oppositeApplies}>
        {#each OPPOSITE_SCHEMES as scheme (scheme.id)}
          <li>
            <button
              class="scheme"
              class:active={oppositeScheme.id === scheme.id}
              onclick={() => oppositeScheme.set(scheme.id)}
            >
              <span class="preview" style={schemeStyle(scheme)} aria-hidden="true">
                <span class="demo-card x"><span class="value">x</span></span>
                <span class="demo-card x neg"><span class="value">−x</span></span>
              </span>
              <span class="meta">
                <span class="name">{labelOf(scheme)}</span>
                <span class="desc">{descOf(scheme)}</span>
              </span>
              {#if oppositeScheme.id === scheme.id}
                <span class="check" aria-hidden="true">✓</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
    </div>
  {/if}
</div>

<style>
  .settings {
    position: relative;
    display: inline-block;
  }
  /* Même gabarit que le bouton « refaire » de la topbar et le plein écran :
     carré arrondi ~2.1rem. */
  .trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.1rem;
    height: 2.1rem;
    border-radius: 0.6rem;
    color: var(--fg);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity 120ms, background 120ms, transform 120ms;
  }
  .trigger:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.16);
    transform: scale(1.05);
  }

  /* Overlay plein écran (téléporté sur body) : modale centrée, navigable même
     en paysage mobile. */
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
  }
  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    border: 0;
    cursor: default;
  }
  .panel {
    position: relative;
    z-index: 1;
    width: min(22rem, 92vw);
    max-height: 90vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0.85rem;
    border-radius: 0.85rem;
    background: rgba(20, 28, 40, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
  }
  h3 {
    margin: 0.2rem 0 0.55rem;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    opacity: 0.6;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  h3.dimmed {
    opacity: 0.35;
  }
  .tag {
    font-size: 0.62rem;
    text-transform: none;
    letter-spacing: 0;
    padding: 0.05rem 0.4rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    opacity: 0.8;
  }
  .hint {
    margin: 0.4rem 0 0.9rem;
    font-size: 0.68rem;
    line-height: 1.3;
    opacity: 0.5;
  }

  /* ─── Section forme : segments ─────────────────────────────────────────── */
  .forms {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }
  .form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.55rem 0.3rem;
    border-radius: 0.6rem;
    color: var(--fg);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid transparent;
    transition: background 120ms, border-color 120ms;
  }
  .form:hover {
    background: rgba(255, 255, 255, 0.09);
  }
  .form.active {
    border-color: var(--accent);
    background: rgba(245, 158, 11, 0.12);
  }
  .form-label {
    font-size: 0.72rem;
    font-weight: 600;
  }
  .form-demo {
    display: inline-flex;
  }

  /* ─── Section opposés : liste ──────────────────────────────────────────── */
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    transition: opacity 120ms;
  }
  ul.dimmed {
    opacity: 0.4;
  }
  .scheme {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.5rem;
    border-radius: 0.6rem;
    text-align: left;
    color: var(--fg);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid transparent;
    transition: background 120ms, border-color 120ms;
  }
  .scheme:hover {
    background: rgba(255, 255, 255, 0.09);
  }
  .scheme.active {
    border-color: var(--accent);
    background: rgba(245, 158, 11, 0.12);
  }
  .meta {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
    flex: 1;
  }
  .name {
    font-size: 0.85rem;
    font-weight: 700;
  }
  .desc {
    font-size: 0.7rem;
    opacity: 0.65;
    line-height: 1.25;
  }
  .check {
    color: var(--accent);
    font-weight: 900;
    flex-shrink: 0;
  }

  /* ─── Cartes d'aperçu : reproduit l'essentiel de .card (styles scoped) ──── */
  .preview {
    display: inline-flex;
    gap: 0.3rem;
    flex-shrink: 0;
  }
  .demo-card {
    --size: 2.1rem;
    position: relative;
    width: var(--size);
    height: var(--size);
    border-radius: 0.4rem;
    border: 2px solid rgba(0, 0, 0, 0.15);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 700;
    font-size: calc(var(--size) * 0.45);
    color: #fff;
    background-color: #fff;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
  }
  .demo-card.x {
    background: linear-gradient(135deg, #f59e0b, #fb923c);
  }
  .demo-card.emojicard {
    font-style: normal;
    font-size: calc(var(--size) * 0.6);
    line-height: 1;
  }
  .demo-card.neg {
    background: var(--opp-neg-bg, #fed7aa);
    border-color: var(--opp-neg-border-color, rgba(0, 0, 0, 0.15));
  }
  .demo-card.x.neg {
    background: var(--opp-neg-x-bg, linear-gradient(135deg, #ea580c, #9a3412));
  }
  .demo-card.neg::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: var(--opp-neg-shadow, none);
    pointer-events: none;
  }
  .demo-card .value {
    display: inline-block;
  }
  .demo-card.neg .value {
    color: var(--opp-neg-fg, inherit);
    -webkit-text-stroke: var(--opp-neg-stroke, 0);
    transform: var(--opp-neg-transform, none);
  }
</style>
