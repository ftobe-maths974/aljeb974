<script lang="ts">
  import { i18n } from "../i18n/store.svelte.ts";

  /** Code court affiché : pour une variante (rcf-kwz) → sous-tag (KWZ). */
  function shortCode(code: string): string {
    return (code.includes("-") ? code.split("-").pop()! : code).toUpperCase();
  }
</script>

<div class="switcher" role="group" aria-label="Langue">
  {#each i18n.availableLocales as loc (loc.code)}
    <button
      class:active={i18n.locale === loc.code}
      onclick={() => i18n.setLocale(loc.code)}
      title={loc.label}
      aria-label={loc.label}
    >
      <span class="flag" aria-hidden="true">{loc.flag}</span>
      <span class="code">{shortCode(loc.code)}</span>
    </button>
  {/each}
</div>

<style>
  .switcher {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 999px;
    padding: 0.25rem;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    color: var(--fg);
    font-size: 0.75rem;
    opacity: 0.65;
    transition: background 120ms, opacity 120ms;
  }
  button:hover {
    opacity: 1;
  }
  button.active {
    background: var(--accent);
    color: var(--bg);
    opacity: 1;
    font-weight: 700;
  }
  .flag {
    font-size: 0.9rem;
    line-height: 1;
  }
</style>
