<script lang="ts">
  /**
   * FlashAlert — le « ! » legacy qui pointe vers la carte que l'élève doit déposer.
   * Apparaît quand l'élève clique au mauvais endroit en mode block.
   *
   * On positionne l'alerte au-dessus de l'élément DOM identifié par
   * `[data-fraction-id="<targetId>"]`.
   */
  import { game } from "../state/game.svelte.ts";
  import { t } from "../i18n/store.svelte.ts";

  const rect = $derived.by(() => {
    if (!game.flashTargetId) return null;
    const el = document.querySelector<HTMLElement>(
      `[data-fraction-id="${game.flashTargetId}"]`,
    );
    if (!el) return null;
    return el.getBoundingClientRect();
  });
</script>

{#if rect}
  <div
    class="flash"
    role="alert"
    style="top: {rect.top - 60}px; left: {rect.left + rect.width / 2}px;"
  >
    <div class="bubble">
      <span class="bang">!</span>
      <span class="msg">{t().flash.line1}<br>{t().flash.line2}</span>
    </div>
    <div class="tail" aria-hidden="true"></div>
  </div>
{/if}

<style>
  .flash {
    position: fixed;
    z-index: 300;
    transform: translateX(-50%);
    pointer-events: none;
    animation: flash-pop 200ms ease-out;
  }
  @keyframes flash-pop {
    from { transform: translate(-50%, 8px); opacity: 0; }
    to   { transform: translate(-50%, 0);   opacity: 1; }
  }
  .bubble {
    background: #ef4444;
    color: white;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    font-weight: 600;
  }
  .bang {
    font-size: 1.5rem;
    font-weight: 900;
  }
  .msg {
    font-size: 0.75rem;
    line-height: 1.2;
  }
  .tail {
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 10px solid #ef4444;
    margin: 0 auto;
  }
</style>
