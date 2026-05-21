<script lang="ts">
  import { t } from "../i18n/store.svelte.ts";

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

  // Feux d'artifice : seulement en 3 étoiles. Bursts répartis aléatoirement
  // dans la moitié haute de l'overlay (au-dessus de la carte), couleurs HSL.
  const PARTICLES_PER_BURST = 14;
  const bursts = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 8 + Math.random() * 84,        // % horizontal
    y: 10 + Math.random() * 35,       // % vertical (haut de l'overlay)
    delay: (i * 0.45 + Math.random() * 0.25).toFixed(2),
    hue: Math.floor(Math.random() * 360),
  }));
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label={t().victory.title}>
  {#if stars === 3}
    <div class="fireworks" aria-hidden="true">
      {#each bursts as b (b.id)}
        <div
          class="burst"
          style="left:{b.x}%; top:{b.y}%; --burst-hue:{b.hue}; --burst-delay:{b.delay}s;"
        >
          {#each Array(PARTICLES_PER_BURST) as _, i}
            <span class="particle" style="--angle:{(i * 360) / PARTICLES_PER_BURST}deg;"></span>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
  <div class="card">
    <h2>{t().victory.title}</h2>
    <div class="stars" aria-label={t().victory.starsLabel(stars)}>
      {#each Array(3) as _, i}
        <span class="star" class:earned={i < stars}>★</span>
      {/each}
    </div>
    <p class="recap">{t().victory.coupsRecap(shots, target)}</p>
    <div class="actions">
      <button onclick={onMenu}>{t().victory.menu}</button>
      <button onclick={onRestart}>{t().victory.restart}</button>
      <button class="primary" onclick={onNext}>{t().victory.next}</button>
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

  /* ─── Feux d'artifice (3 étoiles) ───────────────────────────────────────── */
  .fireworks {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }
  .burst {
    position: absolute;
    width: 0;
    height: 0;
  }
  .particle {
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    background: hsl(var(--burst-hue), 90%, 62%);
    box-shadow: 0 0 10px hsla(var(--burst-hue), 95%, 65%, 0.85);
    opacity: 0;
    transform: rotate(var(--angle)) translateX(0);
    animation: particle-fly 2.4s ease-out var(--burst-delay) infinite;
  }
  @keyframes particle-fly {
    0%   { transform: rotate(var(--angle)) translateX(0);     opacity: 0; }
    8%   { transform: rotate(var(--angle)) translateX(4px);   opacity: 1; }
    60%  { transform: rotate(var(--angle)) translateX(110px); opacity: 0.9; }
    85%  { transform: rotate(var(--angle)) translateX(140px); opacity: 0; }
    100% { transform: rotate(var(--angle)) translateX(0);     opacity: 0; }
  }
  /* La carte de victoire doit passer au-dessus des feux d'artifice. */
  .card {
    position: relative;
    z-index: 1;
  }
</style>
