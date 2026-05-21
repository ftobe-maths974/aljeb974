/**
 * firstInteraction.ts — petit helper pour exécuter une action au premier
 * geste du joueur (clic, tap, drag-start), peu importe où.
 *
 * IMPORTANT : on écoute en phase de CAPTURE pour shunter les éventuels
 * `e.stopPropagation()` posés par les actions de drag enfants
 * (cf. draggableCard du fichier drag.svelte.ts).
 *
 * Renvoie une fonction de nettoyage. Si elle est appelée AVANT le 1er geste,
 * l'événement n'est plus écouté.
 */
export function onFirstInteraction(handler: () => void): () => void {
  const fn = () => {
    handler();
    window.removeEventListener("pointerdown", fn, true);
  };
  window.addEventListener("pointerdown", fn, true);
  return () => window.removeEventListener("pointerdown", fn, true);
}
