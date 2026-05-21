<script lang="ts">
  let {
    stars,
    shots,
    target,
    onNext,
    onRestart,
    onMenu,
  }: {
    stars: 0 | 1 | 2 | 3;
    shots: number;
    target: number;
    onNext: () => void;
    onRestart: () => void;
    onMenu: () => void;
  } = $props();
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Victoire">
  <div class="card">
    <h2>Bravo !</h2>
    <div class="stars" aria-label="{stars} étoile(s) sur 3">
      {#each Array(3) as _, i}
        <span class="star" class:earned={i < stars}>★</span>
      {/each}
    </div>
    <p class="recap">{shots} coup{shots > 1 ? "s" : ""} sur {target} cible.</p>
    <div class="actions">
      <button onclick={onMenu}>Menu</button>
      <button onclick={onRestart}>Refaire</button>
      <button class="primary" onclick={onNext}>Suivant →</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }
  .card {
    background: var(--bg);
    border: 2px solid var(--accent);
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
    max-width: 90%;
    animation: pop-in 200ms ease-out;
  }
  @keyframes pop-in {
    from { transform: scale(0.85); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  h2 {
    margin: 0 0 1rem;
    font-size: 2rem;
    color: var(--accent);
  }
  .stars {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin: 1rem 0;
  }
  .star {
    font-size: 3rem;
    color: rgba(255, 255, 255, 0.15);
    transition: color 200ms;
  }
  .star.earned {
    color: var(--accent);
    text-shadow: 0 0 12px rgba(245, 158, 11, 0.6);
  }
  .recap {
    opacity: 0.8;
    margin: 1rem 0 1.5rem;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .actions button {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: var(--fg);
    font-size: 0.875rem;
  }
  .actions button.primary {
    background: var(--accent);
    color: var(--bg);
    font-weight: 700;
  }
  .actions button:hover {
    transform: translateY(-1px);
  }
</style>
