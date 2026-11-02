import '@fontsource-variable/bricolage-grotesque/opsz.css'; // con l'asse della dimensione ottica: i titoli grandi prendono il taglio da titolo
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
