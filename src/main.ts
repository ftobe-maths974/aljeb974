import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";
// Applique le schéma de cartes opposées sur <html> dès le démarrage.
import "./features/opposite-scheme/store.svelte.ts";
// Initialise le réglage de forme des cartes (image / emoji / texte).
import "./features/card-form/store.svelte.ts";

const target = document.getElementById("app");
if (!target) throw new Error("#app introuvable");

const app = mount(App, { target });

export default app;
