<script lang="ts">
  /**
   * Balance — pivot triangulaire sous le signe = (la pointe d'équilibre).
   *
   * Les plateaux ne sont plus rendus ici : ils sont devenus des enfants
   * de chaque <Side> (cf. Side.svelte > .platter) pour suivre naturellement
   * la bascule du membre via la même transform.
   *
   * Ne reste donc dans ce composant que la pointe centrale, qui ne penche pas.
   */
  import { onMount } from "svelte";
  import { game } from "../state/game.svelte.ts";

  let equalsRect = $state<DOMRect | null>(null);

  function measure() {
    const eq = document.querySelector<HTMLElement>(".equals");
    equalsRect = eq?.getBoundingClientRect() ?? null;
  }

  onMount(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });

  $effect(() => {
    void game.state;
    requestAnimationFrame(measure);
  });
</script>

{#if equalsRect}
  <div
    class="pivot"
    style="
      left: {equalsRect.left + equalsRect.width / 2}px;
      top: {equalsRect.bottom + 6}px;
    "
    aria-hidden="true"
  ></div>
{/if}

<style>
  .pivot {
    position: fixed;
    width: 0;
    height: 0;
    border-left: 14px solid transparent;
    border-right: 14px solid transparent;
    border-bottom: 18px solid rgba(241, 245, 249, 0.55);
    transform: translateX(-50%);
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.4));
    pointer-events: none;
    z-index: 0;
  }
</style>
