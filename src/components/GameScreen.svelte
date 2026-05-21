<script lang="ts">
  import { game } from "../state/game.svelte.ts";
  import { locateCard, isZero, isOne } from "../lib/engine/index.ts";
  import Side from "./Side.svelte";
  import VictoryOverlay from "./VictoryOverlay.svelte";
  import DragGhost from "./DragGhost.svelte";
  import FlashAlert from "./FlashAlert.svelte";
  import Astuce from "./Astuce.svelte";
  import Balance from "./Balance.svelte";
  import LevelIntro from "./LevelIntro.svelte";
  import PuffOverlay from "./PuffOverlay.svelte";
  import Solution from "./Solution.svelte";
  import DivideZone from "./DivideZone.svelte";
  import MultiplyZone from "./MultiplyZone.svelte";
  import { fx } from "../state/fx.svelte.ts";
  import { t } from "../i18n/store.svelte.ts";

  let { onBack }: { onBack?: () => void } = $props();

  function handleDrop(
    sourceFractionId: string,
    target: { fractionId?: string; side?: "lhs" | "rhs"; holeCardId?: string; divideZone?: boolean; multiplyZone?: boolean },
  ) {
    // Chaque drag&drop compte comme un coup, succès ou échec.
    game.recordShot();
    game.tryDrop(sourceFractionId, target);
  }

  function handleCardDrop(sourceCardId: string, targetCardId: string | null) {
    game.recordShot();
    game.tryCardDrop(sourceCardId, targetCardId);
  }

  // Détection manuelle de double-clic (plus fiable que ondblclick natif sur
  // mobile et avec pointerCapture). Si deux clics sur la même carte arrivent
  // en < 350 ms → tryFactorize.
  let lastClickTime = 0;
  let lastClickCardId: string | null = null;

  function handleCardDoubleClick(cardId: string) {
    game.tryFactorize(cardId);
  }

  // Au clic sur une carte : tenter une suppression de 0 ou 1 selon le contexte.
  // (D'autres actions — drag, opposés, etc. — viendront plus tard.)
  function handleCardClick(cardId: string) {
    if (!game.state) return;
    // Détection manuelle de double-clic : 2 clics sur la même carte en < 350 ms.
    const now = performance.now();
    const isDouble = lastClickCardId === cardId && now - lastClickTime < 350;
    if (isDouble) {
      lastClickTime = 0;
      lastClickCardId = null;
      handleCardDoubleClick(cardId);
      return;
    }
    lastClickTime = now;
    lastClickCardId = cardId;
    // Chaque clic compte comme un coup, succès ou échec.
    game.recordShot();
    // En block mode, tout clic ailleurs que sur la pioche-cible = alerte.
    if (game.state.pending) {
      const loc = locateCard(game.state, cardId);
      if (loc && loc.side !== "pioche") {
        game.flashAlert();
      }
      return;
    }
    const loc = locateCard(game.state, cardId);
    if (!loc) return;
    const list =
      loc.where === "numerator"
        ? game.state[loc.side][loc.fractionIdx]!.numerator
        : game.state[loc.side][loc.fractionIdx]!.denominator ?? [];
    const card = list[loc.cardIdx]!;
    // Pioche + reversePower : un clic inverse le signe (niveau 1-16+).
    if (loc.side === "pioche" && game.caps.reversePower) {
      fx.spawnPuffOnCard(cardId, t().fx.takeOpposite);
      game.reverseInPioche(cardId);
      return;
    }
    if (isZero(card.atom)) {
      fx.spawnPuffOnCard(cardId, t().fx.zeroNothing);
      try {
        game.deleteZero(cardId);
      } catch {
        /* ignoré */
      }
    } else if (isOne(card.atom) && card.atom.sign === 1) {
      // « 1 » multiplicatif (positif) : superpower depuis le niveau 2-5.
      // Le « -1 » n'a pas ce comportement (il sert au negPower au chap. 5+).
      const unlocked = game.chapter > 2 || (game.chapter === 2 && game.level >= 5);
      if (unlocked) fx.spawnPuffOnCard(cardId, t().fx.oneNoChange);
      try {
        game.deleteOne(cardId);
      } catch {
        /* ignoré */
      }
    }
  }
</script>

{#if game.state}
  <div class="screen" style="--chapter-hue: {(game.chapter - 1) * 55};">
    <header class="topbar">
      <button class="back" onclick={onBack} aria-label={t().ui.backMenu}>{t().ui.backMenu}</button>
      <div class="info">
        <span class="chapter-badge" aria-hidden="true">{game.chapter}</span>
        <span class="level-label">{t().ui.levelHeader(game.chapter, game.level)}</span>
        <span class="dot" aria-hidden="true">·</span>
        <span class="shots">{t().ui.coupsRecap(game.state.shots, game.state.shotsTarget)}</span>
      </div>
      <button class="restart" onclick={() => game.restart()} aria-label={t().ui.restart}>{t().ui.restart}</button>
    </header>

    <main class="play-area">
      <div class="balance-group">
        <Side fractions={game.state.lhs} name="lhs" onCardClick={handleCardClick} onCardDoubleClick={handleCardDoubleClick} onDrop={handleDrop} onCardDrop={handleCardDrop} />
        {#if game.state.rhs.length > 0}
          <span class="equals">=</span>
          <Side fractions={game.state.rhs} name="rhs" onCardClick={handleCardClick} onCardDoubleClick={handleCardDoubleClick} onDrop={handleDrop} onCardDrop={handleCardDrop} />
        {/if}
        {#if game.state.rhs.length > 0}
          <MultiplyZone />
          <DivideZone />
        {/if}
      </div>
    </main>

    {#if game.state.pioche.length > 0}
      <footer class="pioche-bar">
        <Side fractions={game.state.pioche} name="pioche" onCardClick={handleCardClick} onDrop={handleDrop} />
      </footer>
    {/if}

    {#if game.state.rhs.length > 0}
      <Balance />
    {/if}

    <DragGhost />
    <FlashAlert />
    <Astuce />
    <LevelIntro />
    <PuffOverlay />

    {#if game.solved && game.state.rhs.length > 0 && !game.victoryReady}
      <Solution />
    {/if}

    {#if game.victoryReady}
      <VictoryOverlay
        stars={game.starsEarned}
        shots={game.state.shots}
        target={game.state.shotsTarget}
        onNext={() => game.loadLevel(game.chapter, game.level + 1)}
        onRestart={() => game.restart()}
        onMenu={onBack ?? (() => {})}
      />
    {/if}
  </div>
{:else}
  <p class="loading">{t().ui.loading}</p>
{/if}

<style>
  .screen {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.5rem;
    /* relative pour que les enfants en position absolute (DivideZone,
       Solution, FlashAlert ancrés ici, etc.) se référencent au screen. */
    position: relative;
  }
  .topbar {
    --hue: var(--chapter-hue, 35);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.85rem;
    border: 1px solid hsla(var(--hue), 60%, 70%, 0.18);
    background:
      linear-gradient(
        135deg,
        hsla(var(--hue), 70%, 60%, 0.1) 0%,
        rgba(255, 255, 255, 0.04) 100%
      );
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.05) inset,
      0 6px 18px rgba(0, 0, 0, 0.25);
  }
  .topbar button {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.6rem;
    padding: 0.5rem 0.85rem;
    color: var(--fg);
    font-size: 0.9rem;
    transition: background 160ms, border-color 160ms, transform 160ms;
  }
  .topbar button:hover {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.18);
  }
  .topbar .back:hover {
    transform: translateX(-2px);
  }
  .topbar .restart:hover {
    transform: rotate(-20deg);
  }
  .info {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.9rem;
  }
  .info .chapter-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.7rem;
    height: 1.7rem;
    border-radius: 50%;
    background: linear-gradient(135deg,
      hsl(var(--hue), 80%, 62%),
      hsl(calc(var(--hue) + 25), 80%, 55%)
    );
    color: #0f1722;
    font-weight: 800;
    font-size: 0.85rem;
    box-shadow:
      0 0 0 2px hsla(var(--hue), 70%, 60%, 0.2),
      0 3px 8px hsla(var(--hue), 70%, 30%, 0.35);
  }
  .info .level-label {
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .info .dot {
    opacity: 0.35;
  }
  .info .shots {
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
  }
  .play-area {
    flex: 1;
    display: flex;
    /* La balance entière est centrée verticalement dans la zone de jeu. */
    align-items: center;
    justify-content: center;
  }
  /* Groupe-balance : les deux membres + le « = » + le pivot.
     - `align-items: stretch` → les deux .side ont EXACTEMENT la même hauteur
       (la plus grande des deux contenus dicte). Bottoms alignés naturellement.
     - `.equals` a son propre `align-self: center` → l'égal reste au milieu
       vertical, entre les deux membres.
     - `.lhs/.rhs { flex: 1 1 0 }` → largeurs strictement égales. */
  .balance-group {
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 1rem;
    width: 100%;
    padding: 0 1.5rem 1rem;
  }
  .balance-group :global(.equals) {
    align-self: center;
  }
  .equals {
    font-size: 2.5rem;
    color: var(--accent);
    font-weight: bold;
    padding: 0 0.5rem;
  }
  .pioche-bar {
    flex-shrink: 0;
  }
  .loading {
    padding: 2rem;
    text-align: center;
  }
</style>
