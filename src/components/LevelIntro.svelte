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

  let visible = $state(false);
  let current = $state<KeyLevel | null>(null);
  let onceHandler: ((e: Event) => void) | null = null;

  const localized = $derived.by(() => {
    if (!current) return null;
    const entry = (t().keyLevels as Record<string, { title: string; hint: string }>)[current.id];
    return entry ?? null;
  });

  function dismiss() {
    visible = false;
    if (onceHandler) {
      window.removeEventListener("pointerdown", onceHandler);
      onceHandler = null;
    }
  }

  // L'explication persiste jusqu'au premier geste du joueur — comportement
  // équivalent aux astuces du legacy DragonBox-like.
  $effect(() => {
    const id = `${game.chapter}-${game.level}`;
    void game.state;
    const lvl = getKeyLevel(id);
    dismiss();
    if (lvl) {
      current = lvl;
      setTimeout(() => {
        visible = true;
        onceHandler = () => dismiss();
        // léger délai pour ne pas attraper le clic « entrer dans le niveau »
        setTimeout(() => {
          if (onceHandler) {
            window.addEventListener("pointerdown", onceHandler, { once: true, passive: true });
          }
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
      <span>{localized.hint}</span>
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
