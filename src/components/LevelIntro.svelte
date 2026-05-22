<script lang="ts">
  /**
   * LevelIntro — bannière qui s'affiche au démarrage d'un niveau-clé,
   * avec un emoji, un titre et une phrase imagée pour l'enfant.
   *
   * Texte localisé : récupéré via i18n.keyLevels[id].
   * Auto-dismiss après 6 s, ou au premier pointerdown du joueur.
   */
  import { game } from "../state/game.svelte.ts";
  import { getKeyLevel, type KeyLevel } from "../data/key-levels.ts";
  import { t } from "../i18n/store.svelte.ts";
  import { onFirstInteraction } from "../state/firstInteraction.ts";
  import { shouldRevealAsText } from "../lib/engine/index.ts";
  import { cardForm } from "../features/card-form/store.svelte.ts";
  import { emojiFor } from "../features/card-form/emoji.ts";

  // Comment afficher le « x » dans l'énoncé : avatar (dragon/sprite) si non
  // révélé en mode image/emoji, sinon « x » maths. Suit l'état du plateau.
  const xMode = $derived.by<"text" | "emoji" | "image">(() => {
    if (cardForm.value === "text") return "text";
    if (shouldRevealAsText({ kind: "unknown", sign: 1 }, game.revealSet)) return "text";
    return cardForm.value;
  });

  let visible = $state(false);
  let current = $state<KeyLevel | null>(null);
  let unbind: (() => void) | null = null;

  const localized = $derived.by(() => {
    if (!current) return null;
    const entry = (t().keyLevels as Record<string, { title: string; hint: string }>)[current.id];
    return entry ?? null;
  });

  function dismiss() {
    visible = false;
    unbind?.();
    unbind = null;
  }

  // S'affiche à chaque entrée dans un niveau-clé (menu → niveau ou restart),
  // persiste jusqu'au 1ᵉʳ geste du joueur (comportement wideapp).
  // Capture phase pour shunter les stopPropagation des drags enfants.
  $effect(() => {
    // game.loadCounter incrémente à chaque loadLevel, force le re-trigger
    // même quand chapter/level ne changent pas (restart).
    void game.loadCounter;
    const id = `${game.chapter}-${game.level}`;
    const lvl = getKeyLevel(id);
    dismiss();
    if (lvl) {
      current = lvl;
      setTimeout(() => {
        visible = true;
        setTimeout(() => {
          unbind = onFirstInteraction(dismiss);
        }, 300);
      }, 150);
    }
  });
</script>

{#if visible && current && localized}
  <div class="intro" role="dialog" aria-live="polite">
    <span class="emoji" aria-hidden="true">{current.emoji}</span>
    <div class="text">
      <strong>{localized.title}</strong>
      <span>
        {#each localized.hint.split(/(\bx\b)/) as seg, i (i)}
          {#if i % 2 === 1}
            {#if xMode === "image"}
              <img class="x-img" src="{import.meta.env.BASE_URL}cartes/x.png" alt="x" />
            {:else if xMode === "emoji"}
              <span class="x-emoji">{emojiFor("x")}</span>
            {:else}
              <span class="x-math">x</span>
            {/if}
          {:else}{seg}{/if}
        {/each}
      </span>
    </div>
    <button class="close" onclick={dismiss} aria-label="Fermer">✕</button>
  </div>
{/if}

<style>
  .intro {
    position: absolute;
    top: 3.5rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 34, 0.95);
    color: var(--fg);
    border: 2px solid var(--accent);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: min(90vw, 36rem);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    z-index: 60;
    animation: intro-in 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes intro-in {
    0%   { transform: translate(-50%, -12px); opacity: 0; }
    100% { transform: translate(-50%, 0);     opacity: 1; }
  }
  .emoji {
    font-size: 2rem;
    line-height: 1;
    flex-shrink: 0;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
    text-align: left;
    line-height: 1.3;
  }
  .text strong {
    color: var(--accent);
    font-size: 1.15rem;
  }
  .text span {
    font-size: 1.05rem;
    line-height: 1.4;
    opacity: 0.95;
  }
  /* « x » de l'énoncé, aligné sur la représentation du plateau. */
  .x-math {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 800;
    color: var(--accent);
  }
  .x-emoji {
    font-size: 1.25em;
    vertical-align: -0.15em;
  }
  .x-img {
    height: 1.4em;
    vertical-align: -0.35em;
  }
  .close {
    background: rgba(255, 255, 255, 0.1);
    color: var(--fg);
    border-radius: 999px;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    flex-shrink: 0;
  }
  .close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
