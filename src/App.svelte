<script lang="ts">
  import levelsData from "../migration/levels.json";
  import OrientationGate from "./lib/OrientationGate.svelte";
  import GameScreen from "./components/GameScreen.svelte";
  import { game } from "./state/game.svelte.ts";

  type Screen = "home" | "menu" | "play";
  let screen = $state<Screen>("home");

  const totalChapters = levelsData.chapters.length;
  const totalLevels = levelsData.chapters.reduce(
    (acc, c) => acc + Object.keys(c.levels).length,
    0,
  );

  function startLevel(chapter: number, level: number) {
    game.loadLevel(chapter, level);
    screen = "play";
  }
</script>

<OrientationGate>
  {#if screen === "home"}
    <main class="placeholder">
      <header>
        <h1>Aljeb974</h1>
        <p class="tagline">Apprends à résoudre des équations en manipulant des cartes.</p>
      </header>

      <section class="status">
        <p>
          <strong>{totalChapters}</strong> chapitres ·
          <strong>{totalLevels}</strong> niveaux chargés
        </p>
        <p class="badges">
          <span class="badge">✓ DSL parsé</span>
          <span class="badge">✓ moteur TS pur</span>
          <span class="badge">✓ 37 tests verts</span>
        </p>

        <div class="cta">
          <button class="primary" onclick={() => startLevel(1, 1)}>Jouer le niveau 1-1</button>
          <button onclick={() => (screen = "menu")}>Choisir un niveau</button>
        </div>
      </section>

      <footer>
        <a href="https://github.com/ftobe-maths974/aljeb974" target="_blank" rel="noopener">
          github.com/ftobe-maths974/aljeb974
        </a>
      </footer>
    </main>
  {:else if screen === "menu"}
    <main class="menu">
      <header class="menu-top">
        <button class="back" onclick={() => (screen = "home")}>← Accueil</button>
        <h2>Choisis un niveau</h2>
      </header>
      <div class="chapters">
        {#each levelsData.chapters as chapter (chapter.index)}
          <section class="chapter">
            <h3>Chapitre {chapter.index}</h3>
            <div class="levels">
              {#each Object.keys(chapter.levels).map(Number).sort((a, b) => a - b) as lv (lv)}
                <button class="level" onclick={() => startLevel(chapter.index, lv)}>
                  {lv}
                </button>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    </main>
  {:else}
    <GameScreen onBack={() => (screen = "menu")} />
  {/if}
</OrientationGate>

<style>
  .placeholder {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 2rem;
    text-align: center;
  }
  h1 {
    font-size: 3rem;
    margin: 0;
    background: linear-gradient(135deg, #f59e0b, #fb923c);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .tagline {
    margin: 0.5rem 0 0;
    opacity: 0.75;
  }
  .status {
    margin: auto 0;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin: 1rem 0;
  }
  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 999px;
    font-size: 0.75rem;
    color: var(--accent);
    background: rgba(245, 158, 11, 0.05);
  }
  .cta {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }
  .cta button {
    padding: 0.75rem 1.25rem;
    background: rgba(255, 255, 255, 0.1);
    color: var(--fg);
    border-radius: 0.5rem;
    font-size: 0.95rem;
  }
  .cta button.primary {
    background: var(--accent);
    color: var(--bg);
    font-weight: 700;
  }
  .cta button:hover {
    transform: translateY(-1px);
  }
  footer a {
    color: var(--accent);
    text-decoration: none;
    font-size: 0.8rem;
    opacity: 0.7;
  }
  footer a:hover {
    opacity: 1;
  }

  /* Menu */
  .menu {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.5rem 1rem 1rem;
    overflow: auto;
  }
  .menu-top {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .menu-top h2 {
    margin: 0;
    font-size: 1.2rem;
  }
  .menu-top .back {
    background: rgba(255, 255, 255, 0.1);
    color: var(--fg);
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
  }
  .chapters {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }
  .chapter h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    opacity: 0.75;
  }
  .levels {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));
    gap: 0.4rem;
  }
  .level {
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.08);
    color: var(--fg);
    border-radius: 0.4rem;
    font-weight: 700;
    font-size: 0.95rem;
  }
  .level:hover {
    background: var(--accent);
    color: var(--bg);
  }
</style>
