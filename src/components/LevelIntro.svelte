<script lang="ts">
  /**
   * LevelIntro — bannière qui s'affiche au démarrage d'un niveau-clé,
   * avec un emoji, un titre et une phrase imagée pour l'enfant.
   *
   * Auto-dismiss après 6 s, ou au premier pointerdown du joueur.
   * Reactivité au changement de niveau (game.chapter / game.level).
   */
  import { game } from "../state/game.svelte.ts";
  import { getKeyLevel, type KeyLevel } from "../data/key-levels.ts";

  let visible = $state(false);
  let current = $state<KeyLevel | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let onceHandler: ((e: Event) => void) | null = null;

  function dismiss() {
    visible = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (onceHandler) {
      window.removeEventListener("pointerdown", onceHandler);
      onceHandler = null;
    }
  }

  // Quand le niveau change, on tente d'afficher la bannière.
  $effect(() => {
    const id = `${game.chapter}-${game.level}`;
    // Lecture de game.state pour réagir au loadLevel (relance même niveau).
    void game.state;
    const lvl = getKeyLevel(id);
    dismiss();
    if (lvl) {
      current = lvl;
      // léger délai pour laisser l'astuce s'amorcer
      setTimeout(() => {
        visible = true;
        timer = setTimeout(dismiss, 6000);
        // Le pointerdown du joueur ferme aussi la bannière (cf. legacy astuces).
        onceHandler = () => dismiss();
        // On laisse passer un tick avant d'écouter pour éviter de fermer
        // immédiatement à cause de l'événement de loadLevel.
        setTimeout(() => {
          if (onceHandler) {
            window.addEventListener("pointerdown", onceHandler, { once: true, passive: true });
          }
        }, 200);
      }, 150);
    }
  });
</script>

{#if visible && current}
  <div class="intro" role="dialog" aria-live="polite">
    <span class="emoji" aria-hidden="true">{current.emoji}</span>
    <div class="text">
      <strong>{current.title}</strong>
      <span>{current.hint}</span>
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
    font-size: 0.95rem;
  }
  .text span {
    font-size: 0.85rem;
    opacity: 0.92;
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
