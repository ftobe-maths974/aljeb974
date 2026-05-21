/**
 * Façade publique du moteur Aljeb974.
 *
 * Convention : tout passe par cet index — les composants Svelte n'importent
 * jamais directement les sous-modules.
 */

export * from "./dsl.ts";
export * from "./atoms.ts";
export * from "./state.ts";
export * from "./operations.ts";
export * from "./solver.ts";
