<script lang="ts">
  /**
   * DropZone — l'équivalent du `.rootDrop` legacy.
   * S'affiche sur le côté en attente d'un 2ᵉ drop pendant un block mode.
   * Cible de drop : reçoit `data-side` pour que le picker du drag store
   * trouve la bonne cible. Un petit ✕ permet d'annuler le drop en cours.
   */
  import { t } from "../i18n/store.svelte.ts";
  import { game } from "../state/game.svelte.ts";

  let {
    side,
    cardSummary,
  }: {
    side: "lhs" | "rhs";
    /** Texte court qui décrit ce que l'élève doit déposer (ex : « −g »). */
    cardSummary: string;
  } = $props();
</script>

<div class="dropzone-wrap">
  <div class="dropzone" data-side={side} aria-label={`${t().drop.hintTop} ${cardSummary} ${t().drop.hintBottom}`}>
    <span class="hint">{t().drop.hintTop}</span>
    <span class="card-shape">{cardSummary}</span>
    <span class="hint">{t().drop.hintBottom}</span>
  </div>
  <button
    class="cancel"
    onclick={() => game.cancelPending()}
    aria-label={t().pending.cancel}
    title={t().pending.cancel}
  >✕</button>
</div>

<style>
  .dropzone-wrap {
    position: relative;
    display: inline-block;
  }
  .cancel {
    position: absolute;
    top: -0.55rem;
    right: -0.55rem;
    background: rgba(15, 23, 34, 0.95);
    color: var(--fg);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 999px;
    width: 1.4rem;
    height: 1.4rem;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    opacity: 0.85;
    z-index: 2;
  }
  .cancel:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 1);
  }
  .dropzone {
    --pulse: rgba(245, 158, 11, 0.6);
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border: 3px dashed var(--accent);
    border-radius: 0.75rem;
    background: rgba(245, 158, 11, 0.08);
    color: var(--accent);
    font-size: 0.75rem;
    min-width: 5rem;
    min-height: 5rem;
    animation: dz-pulse 1.4s ease-in-out infinite;
  }
  .card-shape {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--accent);
  }
  .hint {
    font-style: normal;
    opacity: 0.85;
    text-align: center;
  }
  @keyframes dz-pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 var(--pulse);
    }
    50% {
      box-shadow: 0 0 0 8px transparent;
    }
  }
</style>
