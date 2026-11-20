import '@fontsource-variable/bricolage-grotesque/opsz.css'; // con l'asse della dimensione ottica: i titoli grandi prendono il taglio da titolo
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

// il contenitore porta il testo statico della home, per chi non esegue JavaScript: l'app ne prende il posto, mai accanto
const contenitore = document.getElementById('app')!;
contenitore.replaceChildren();
mount(App, { target: contenitore });
