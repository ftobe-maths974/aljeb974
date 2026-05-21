<script lang="ts">
  import levelsData from "../migration/levels.json";
  import OrientationGate from "./lib/OrientationGate.svelte";

  const totalChapters = levelsData.chapters.length;
  const totalLevels = levelsData.chapters.reduce(
    (acc, c) => acc + Object.keys(c.levels).length,
    0,
  );
</script>

<OrientationGate>
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
      <p class="muted">Squelette en cours de portage. L'interface arrive bientôt.</p>
    </section>

    <footer>
      <a href="https://github.com/ftobe-maths974/aljeb974" target="_blank" rel="noopener">
        github.com/ftobe-maths974/aljeb974
      </a>
    </footer>
  </main>
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
  .muted {
    opacity: 0.5;
    font-size: 0.875rem;
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
</style>
