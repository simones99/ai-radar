import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { FIXTURE } from '../test/fixtures';
import SourcesStatus from './SourcesStatus.svelte';

const ok = { stato: 'ok' as const, ultimo_successo: '2026-10-27T15:39:10+00:00' };
const tutteOk = { aggiornato: '2026-10-27T15:42:09+00:00', fonti: { epoch: ok, arxiv: ok } };
const stato = () => screen.getByRole('region', { name: 'Stato delle fonti' });

describe('Stato delle fonti: quanto sono vecchi i dati', () => {
  it('entro 8 giorni dall’ultimo aggiornamento le fonti sono aggiornate', () => {
    render(SourcesStatus, { status: tutteOk, today: new Date(2026, 10, 4, 10) });
    expect(stato()).toHaveTextContent('Tutte le 2 fonti sono aggiornate. Ultimo aggiornamento: 27 ott 2026.');
  });
  it('oltre 8 giorni lo dice, e non parla più di fonti aggiornate', () => {
    render(SourcesStatus, { status: tutteOk, today: new Date(2026, 10, 5, 10) });
    expect(stato()).toHaveTextContent('Ultimo aggiornamento 9 giorni fa, il 27 ott 2026.');
    expect(stato()).not.toHaveTextContent('sono aggiornate');
  });
  it('le fonti da controllare si leggono anche con i dati vecchi', () => {
    render(SourcesStatus, { status: FIXTURE.status, today: new Date(2026, 10, 5, 10) });
    expect(stato()).toHaveTextContent('da controllare');
    expect(stato()).toHaveTextContent('Ultimo aggiornamento 21 giorni fa, il 15 ott 2026.');
  });
});

describe('Stato delle fonti: un numero che non torna si segnala', () => {
  const MODELLO = 'https://github.com/simones99/ai-radar/issues/new?template=un-numero-non-torna.yml';
  const segnala = () => within(stato()).getByRole('link', { name: 'Segnalalo su GitHub' });

  it('il link apre il modello di issue «Un numero non torna», e dice cosa scrivere', () => {
    render(SourcesStatus, { status: tutteOk, today: new Date(2026, 10, 4, 10) });
    expect(segnala()).toHaveAttribute('href', MODELLO);
    expect(stato()).toHaveTextContent('Un numero non torna con la sua fonte? Segnalalo su GitHub, con la card, il numero e la fonte che hai controllato.');
  });
  it('c’è anche quando lo stato delle fonti non è arrivato', () => {
    render(SourcesStatus, { status: undefined, today: new Date(2026, 10, 4, 10), mancanti: ['status'] });
    expect(stato()).toHaveTextContent('Lo stato delle fonti non è arrivato.');
    expect(segnala()).toHaveAttribute('href', MODELLO);
  });
});
