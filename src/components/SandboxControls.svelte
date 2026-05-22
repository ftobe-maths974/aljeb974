<script lang="ts">
  /**
   * SandboxControls — panneau de pouvoirs (superpowers) du niveau Sandbox.
   * Chaque pouvoir est activable/désactivable à la volée ; game.caps lit le
   * store sandbox, donc l'effet est immédiat.
   */
  import { sandbox, SANDBOX_POWERS } from "../state/sandbox.svelte.ts";
  import { i18n } from "../i18n/store.svelte.ts";

  let open = $state(true);
  const lang = $derived(i18n.locale === "en" ? "en" : "fr");
</script>

<div class="sandbox" class:open>
  <button class="head" onclick={() => (open = !open)} aria-expanded={open}>
    <span aria-hidden="true">🧪</span>
    <span>{lang === "en" ? "Powers" : "Pouvoirs"}</span>
    <span class="chev" aria-hidden="true">{open ? "▾" : "▸"}</span>
  </button>
  {#if open}
    <div class="list">
      {#each SANDBOX_POWERS as p (p.key)}
        <button
          class="pw"
          class:on={sandbox.powers[p.key]}
          onclick={() => sandbox.toggle(p.key)}
          role="switch"
          aria-checked={sandbox.powers[p.key]}
        >
          <span class="sw" aria-hidden="true"></span>
          <span class="lbl">{p.label[lang]}</span>
        </button>
      {/each}
      <button class="reset" onclick={() => sandbox.reset()}>
        ↺ {lang === "en" ? "Reset" : "Défaut"}
      </button>
    </div>
  {/if}
</div>

<style>
  .sandbox {
    position: absolute;
    top: 3.4rem;
    left: 0.5rem;
    z-index: 70;
    width: 13.5rem;
    max-width: 70vw;
    border-radius: 0.7rem;
    background: rgba(20, 28, 40, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    overflow: hidden;
  }
  .head {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.65rem;
    color: var(--fg);
    font-weight: 700;
    font-size: 0.85rem;
  }
  .head .chev {
    margin-left: auto;
    opacity: 0.6;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0 0.4rem 0.5rem;
    max-height: 60vh;
    overflow-y: auto;
  }
  .pw {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.4rem;
    border-radius: 0.45rem;
    color: var(--fg);
    text-align: left;
    font-size: 0.78rem;
    opacity: 0.7;
    transition: background 120ms, opacity 120ms;
  }
  .pw:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  .pw.on {
    opacity: 1;
  }
  /* Petit interrupteur */
  .sw {
    position: relative;
    flex-shrink: 0;
    width: 1.6rem;
    height: 0.9rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    transition: background 140ms;
  }
  .sw::after {
    content: "";
    position: absolute;
    top: 0.1rem;
    left: 0.1rem;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    background: #cbd5e1;
    transition: transform 140ms, background 140ms;
  }
  .pw.on .sw {
    background: var(--accent);
  }
  .pw.on .sw::after {
    transform: translateX(0.7rem);
    background: #fff;
  }
  .lbl {
    line-height: 1.15;
  }
  .reset {
    margin-top: 0.3rem;
    align-self: flex-start;
    color: var(--fg);
    opacity: 0.6;
    font-size: 0.75rem;
    padding: 0.25rem 0.4rem;
    border-radius: 0.4rem;
  }
  .reset:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.08);
  }
</style>
