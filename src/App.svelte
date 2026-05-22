<script lang="ts">
  import levelsData from "../migration/levels.json";
  import OrientationGate from "./lib/OrientationGate.svelte";
  import GameScreen from "./components/GameScreen.svelte";
  import LocaleSwitcher from "./components/LocaleSwitcher.svelte";
  import { CardDisplaySettings } from "./features/card-form";
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
        <CardDisplaySettings />
        <LocaleSwitcher />
      </div>
      <div class="center-group">
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
        <header>
          <h1>Aldjabar974</h1>
          <p class="tagline">{t().ui.tagline}</p>
          <img class="logo" src="{import.meta.env.BASE_URL}logo.svg" alt="Aldjabar974" />
        </header>
      </div>
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
          <CardDisplaySettings />
          <LocaleSwitcher />
        </div>
      </header>
      <div class="chapters">
        {#each levelsData.chapters as chapter (chapter.index)}
          {@const count = Object.keys(chapter.levels).length}
          <section class="chapter" style="--chapter-hue: {(chapter.index - 1) * 55};">
            <header class="chapter-head">
              <span class="chapter-badge">{chapter.index}</span>
              <div class="chapter-title">
                <h3>{t().ui.chapter} {chapter.index}</h3>
                <span class="chapter-count">{count} {t().ui.levels}</span>
              </div>
            </header>
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
                  <span class="level-num">{lv}</span>
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
    justify-content: center;
    align-items: center;
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  /* Le groupe central regroupe status (counts + CTA) et le titre, alignés
     verticalement et centrés dans la page. */
  .center-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
  .placeholder footer {
    position: absolute;
    bottom: 1rem;
    left: 0;
    right: 0;
    text-align: center;
  }
  .lang-corner-menu {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
  .logo {
    display: block;
    width: clamp(8rem, 22vh, 14rem);
    height: auto;
    margin: 1.25rem auto 0;
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

  /* ─── Menu des niveaux (glassmorphism) ──────────────────────────────────── */
  .menu {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.75rem 1rem 1.5rem;
    overflow: auto;
    position: relative;
    background:
      radial-gradient(
        ellipse at top,
        rgba(245, 158, 11, 0.08) 0%,
        transparent 60%
      ),
      linear-gradient(
        180deg,
        rgba(15, 23, 34, 0.85) 0%,
        rgba(15, 23, 34, 0.95) 100%
      ),
      url("/renyon.1.jpg") center / cover no-repeat fixed;
  }
  .menu-top {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.25rem 0 1rem;
    position: sticky;
    top: 0;
    z-index: 5;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: linear-gradient(180deg, rgba(15, 23, 34, 0.9), rgba(15, 23, 34, 0.65));
  }
  .menu-top h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .menu-top .back {
    background: rgba(255, 255, 255, 0.08);
    color: var(--fg);
    padding: 0.55rem 0.9rem;
    border-radius: 0.6rem;
    font-size: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: background 160ms, border-color 160ms, transform 160ms;
  }
  .menu-top .back:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateX(-2px);
  }

  .chapters {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin: 0 auto;
    max-width: 64rem;
    width: 100%;
  }

  .chapter {
    --hue: var(--chapter-hue, 35);
    position: relative;
    padding: 1.1rem 1.1rem 1.2rem;
    border-radius: 1rem;
    background:
      linear-gradient(
        135deg,
        hsla(var(--hue), 70%, 60%, 0.08) 0%,
        rgba(255, 255, 255, 0.04) 100%
      );
    border: 1px solid hsla(var(--hue), 60%, 70%, 0.18);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.05) inset,
      0 8px 24px rgba(0, 0, 0, 0.25);
    transition: transform 220ms, box-shadow 220ms;
  }
  .chapter:hover {
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.07) inset,
      0 12px 28px rgba(0, 0, 0, 0.32);
  }
  .chapter-head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.9rem;
  }
  .chapter-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: linear-gradient(135deg,
      hsl(var(--hue), 80%, 62%),
      hsl(calc(var(--hue) + 25), 80%, 55%)
    );
    color: #0f1722;
    font-weight: 800;
    font-size: 1.05rem;
    box-shadow:
      0 0 0 3px hsla(var(--hue), 70%, 60%, 0.18),
      0 4px 10px hsla(var(--hue), 70%, 30%, 0.4);
  }
  .chapter-title {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .chapter-title h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }
  .chapter-count {
    font-size: 0.75rem;
    opacity: 0.55;
    text-transform: lowercase;
    letter-spacing: 0.04em;
  }

  .levels {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(3.25rem, 1fr));
    gap: 0.55rem;
  }
  .level {
    --lvl-bg: rgba(255, 255, 255, 0.06);
    --lvl-border: rgba(255, 255, 255, 0.08);
    aspect-ratio: 1;
    background: var(--lvl-bg);
    color: var(--fg);
    border: 1px solid var(--lvl-border);
    border-radius: 0.7rem;
    font-weight: 700;
    font-size: 1.05rem;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      background 180ms,
      border-color 180ms,
      transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 180ms;
    overflow: visible;
  }
  .level::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      hsla(var(--hue), 80%, 65%, 0) 0%,
      hsla(var(--hue), 80%, 55%, 0) 100%
    );
    pointer-events: none;
    transition: background 220ms;
  }
  .level:hover {
    --lvl-bg: hsla(var(--hue), 80%, 55%, 0.18);
    --lvl-border: hsla(var(--hue), 80%, 65%, 0.5);
    transform: translateY(-2px);
    box-shadow:
      0 6px 14px hsla(var(--hue), 70%, 25%, 0.5),
      0 0 0 1px hsla(var(--hue), 80%, 65%, 0.25);
  }
  .level:hover::before {
    background: linear-gradient(
      135deg,
      hsla(var(--hue), 80%, 65%, 0.12) 0%,
      hsla(var(--hue), 80%, 45%, 0.05) 100%
    );
  }
  .level:active {
    transform: translateY(0);
  }
  .level-num {
    position: relative;
    z-index: 1;
  }
  .level.key-level {
    --lvl-bg: linear-gradient(
      135deg,
      rgba(245, 158, 11, 0.22),
      rgba(251, 146, 60, 0.12)
    );
    --lvl-border: rgba(245, 158, 11, 0.5);
    color: #fbcf85;
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.15), inset 0 0 16px rgba(245, 158, 11, 0.06);
  }
  .level.key-level:hover {
    --lvl-bg: linear-gradient(
      135deg,
      rgba(245, 158, 11, 0.4),
      rgba(251, 146, 60, 0.25)
    );
    --lvl-border: rgba(245, 158, 11, 0.85);
    color: var(--bg);
    box-shadow:
      0 6px 18px rgba(245, 158, 11, 0.35),
      0 0 0 2px rgba(245, 158, 11, 0.45);
  }
  .level .bulb {
    position: absolute;
    top: -0.45rem;
    right: -0.45rem;
    font-size: 0.85rem;
    filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.8));
    animation: bulb-glow 2.2s ease-in-out infinite;
    z-index: 2;
  }
  @keyframes bulb-glow {
    0%, 100% { transform: scale(1) rotate(-4deg); }
    50%      { transform: scale(1.18) rotate(4deg); }
  }
</style>
