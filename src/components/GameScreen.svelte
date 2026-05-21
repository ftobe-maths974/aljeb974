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
  import Spotlight from "./Spotlight.svelte";
  import Solution from "./Solution.svelte";
  import { fx } from "../state/fx.svelte.ts";
  import { t } from "../i18n/store.svelte.ts";

  let { onBack }: { onBack?: () => void } = $props();

  function handleDrop(
    sourceFractionId: string,
    target: { fractionId?: string; side?: "lhs" | "rhs" },
  ) {
    game.tryDrop(sourceFractionId, target);
  }

  // Au clic sur une carte : tenter une suppression de 0 ou 1 selon le contexte.
  // (D'autres actions — drag, opposés, etc. — viendront plus tard.)
  function handleCardClick(cardId: string) {
    if (!game.state) return;
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
    } else if (isOne(card.atom)) {
      fx.spawnPuffOnCard(cardId, t().fx.oneNoChange);
      try {
        game.deleteOne(cardId);
      } catch {
        /* ignoré */
      }
    }
  }
</script>

{#if game.state}
  <div class="screen">
    <header class="topbar">
      <button class="back" onclick={onBack} aria-label={t().ui.backMenu}>{t().ui.backMenu}</button>
      <span class="info">
        {t().ui.levelHeader(game.chapter, game.level)} · {t().ui.coupsRecap(game.state.shots, game.state.shotsTarget)}
      </span>
      <button class="restart" onclick={() => game.restart()} aria-label={t().ui.restart}>{t().ui.restart}</button>
    </header>

    <main class="play-area">
      <Side fractions={game.state.lhs} name="lhs" onCardClick={handleCardClick} onDrop={handleDrop} />
      {#if game.state.rhs.length > 0}
        <span class="equals">=</span>
        <Side fractions={game.state.rhs} name="rhs" onCardClick={handleCardClick} onDrop={handleDrop} />
      {/if}
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
    <Spotlight />
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
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 0.5rem;
  }
  .topbar button {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    color: var(--fg);
    font-size: 0.875rem;
  }
  .topbar button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .info {
    font-size: 0.875rem;
    opacity: 0.85;
  }
  .play-area {
    flex: 1;
    display: flex;
    /* flex-end : tous les bas (cartes + plateaux + pivot) s'alignent sur
       une même ligne horizontale, comme une vraie balance. */
    align-items: flex-end;
    justify-content: center;
    gap: 0.5rem;
    padding-bottom: 1.5rem;
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
