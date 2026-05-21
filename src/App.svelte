<script lang="ts">
  import levelsData from "../migration/levels.json";
  import OrientationGate from "./lib/OrientationGate.svelte";
  import GameScreen from "./components/GameScreen.svelte";
  import LocaleSwitcher from "./components/LocaleSwitcher.svelte";
  import { game } from "./state/game.svelte.ts";
  import { astuce } from "./state/astuce.svelte.ts";
  import { KEY_LEVEL_IDS, getKeyLevel } from "./data/key-levels.ts";
  import { t } from "./i18n/store.svelte.ts";

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

  function goToMenu() {
    astuce.stop();
    screen = "menu";
  }

  // Localized key-level entry (title + hint) for tooltips
  function keyLevelLabel(id: string): string {
    const entry = (t().keyLevels as Record<string, { title: string; hint: string }>)[id];
    return entry?.title ?? "";
  }
</script>

<OrientationGate>
  {#if screen === "home"}
    <main class="placeholder">
      <div class="lang-corner">
        <LocaleSwitcher />
      </div>
      <header>
        <h1>Aljeb974</h1>
        <p class="tagline">{t().ui.tagline}</p>
      </header>

      <section class="status">
        <p>
          <strong>{totalChapters}</strong> {t().ui.chapters} ·
          <strong>{totalLevels}</strong> {t().ui.levels}
        </p>

        <div class="cta">
          <button class="primary" onclick={() => startLevel(1, 1)}>{t().ui.playFirstLevel}</button>
          <button onclick={() => (screen = "menu")}>{t().ui.chooseLevel}</button>
        </div>
      </section>

      <footer>
        <a href="https://github.com/ftobe-maths974/aljeb974" target="_blank" rel="noopener">
          {t().ui.githubLink}
        </a>
      </footer>
    </main>
  {:else if screen === "menu"}
    <main class="menu">
      <header class="menu-top">
        <button class="back" onclick={() => (screen = "home")}>{t().ui.backHome}</button>
        <h2>{t().ui.chooseLevelTitle}</h2>
        <div class="lang-corner-menu">
          <LocaleSwitcher />
        </div>
      </header>
      <div class="chapters">
        {#each levelsData.chapters as chapter (chapter.index)}
          <section class="chapter">
            <h3>{t().ui.chapter} {chapter.index}</h3>
            <div class="levels">
              {#each Object.keys(chapter.levels).map(Number).sort((a, b) => a - b) as lv (lv)}
                {@const id = `${chapter.index}-${lv}`}
                {@const key = KEY_LEVEL_IDS.has(id) ? getKeyLevel(id) : null}
                <button
                  class="level"
                  class:key-level={key}
                  onclick={() => startLevel(chapter.index, lv)}
                  title={key ? keyLevelLabel(id) : ""}
                >
                  {lv}
                  {#if key}
                    <span class="bulb" aria-label={keyLevelLabel(id)}>💡</span>
                  {/if}
                </button>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    </main>
  {:else}
    <GameScreen onBack={goToMenu} />
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
    position: relative;
    /* Illustration Réunion en fond, voilée pour préserver la lisibilité. */
    background:
      linear-gradient(
        180deg,
        rgba(15, 23, 34, 0.55) 0%,
        rgba(15, 23, 34, 0.78) 50%,
        rgba(15, 23, 34, 0.95) 100%
      ),
      url("/renyon.1.jpg") center / cover no-repeat;
  }
  .lang-corner {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
  }
  .lang-corner-menu {
    margin-left: auto;
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
    position: relative;
  }
  .level:hover {
    background: var(--accent);
    color: var(--bg);
  }
  .level.key-level {
    border: 1px solid rgba(245, 158, 11, 0.4);
  }
  .level .bulb {
    position: absolute;
    top: -0.4rem;
    right: -0.4rem;
    font-size: 0.85rem;
    filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.7));
    animation: bulb-glow 2s ease-in-out infinite;
  }
  @keyframes bulb-glow {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.15); }
  }
</style>
