import { describe, expect, it } from 'vitest';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import type { Dataset } from '../data/types';
import {
  faceBusiness, faceCompetenze, faceModelli, faceNotizie, faceOpen, facePersone, facePolitica, faceRapporti,
  headBusiness, headCompetenze, headPolitica, heroThesis, tipoLabel,
} from './frasi';

const d = FIXTURE as Dataset;
const text = (parts: { t: string }[]) => parts.map((p) => p.t).join('');

describe('numeri chiave delle card', () => {
  it('modelli: crescita del calcolo', () => {
    expect(faceModelli(d, today)).toEqual({ fig: '×4,8', unit: "all'anno", sent: 'Quanto cresce il calcolo per addestrare i modelli di frontiera, dal 2018.' });
    expect(faceModelli({}, today)).toBeNull();
  });
  it('open source: tipo più frequente, senza contare "altro"', () => {
    expect(faceOpen(d, today)).toEqual({ fig: '37', unit: 'su 100', sent: 'Modelli di tendenza su Hugging Face di tipo «immagine e testo».' });
  });
  it('business: investimenti e rapporto con l’anno prima', () => {
    expect(faceBusiness(d, today)).toEqual({ fig: '290', unit: 'mld $', sent: 'Investimenti privati in AI nel 2025: 2,2 volte il 2024 (dollari 2021).' });
  });
  it('persone: mondo e Italia', () => {
    expect(facePersone(d, today)?.sent).toBe("Persone nel mondo che usano l'AI generativa. In Italia il 30,2%.");
    expect(facePersone(d, today)?.fig).toBe('17,8');
  });
  it('politica: giorni alla prossima scadenza, e nessuna scadenza', () => {
    expect(facePolitica(d, today)).toEqual({ fig: '48', unit: 'giorni', sent: "Alla prossima scadenza dell'AI Act, il 2 dic 2026: fine della transizione per la marcatura." });
    const late = new Date(2029, 0, 1);
    expect(facePolitica(d, late)).toEqual({ fig: '0', unit: 'scadenze in arrivo', sent: "Nessuna scadenza dell'AI Act in arrivo." });
  });
  it('competenze: chi entra e chi esce', () => {
    expect(faceCompetenze(d, today)).toEqual({ fig: 'MCP', unit: '', sent: 'Entra tra le competenze da imparare ora; RAG esce.' });
  });
  it('competenze: radar vecchio senza posizione precedente', () => {
    const old: Dataset = { radar: { ...d.radar!, competenze: d.radar!.competenze.map(({ slancio_prec, domanda_prec, quadrante_prec, breve, ...r }) => r) } };
    expect(faceCompetenze(old, today)).toEqual({ fig: '2', unit: 'su 5', sent: 'Competenze da imparare ora: sopra la mediana sia per slancio sia per domanda.' });
  });
  it('notizie: settimana e settimana vuota', () => {
    expect(faceNotizie(d, today)).toEqual({ fig: '2', unit: '', sent: 'Notizie negli ultimi 7 giorni da 2 fonti.' });
    expect(faceNotizie(d, new Date(2026, 11, 1))?.sent).toBe('Nessuna notizia negli ultimi 7 giorni.');
  });
  it('rapporti: prossimo previsto', () => {
    expect(faceRapporti(d, today)).toEqual({ fig: 'Ottobre', unit: '2026', sent: 'Prossimo rapporto previsto: State of AI Report.' });
    expect(faceRapporti(d, new Date(2028, 0, 1))?.sent).toBe('Nessun rapporto previsto nei prossimi mesi.');
  });
});

describe('titoli e tesi', () => {
  it('competenze', () => {
    const h = headCompetenze(d, today);
    expect(text(h.title)).toBe('MCP entra tra le competenze da imparare ora');
    expect(h.title[0]).toEqual({ t: 'MCP', em: true });
    expect(h.deck).toBe('RAG esce da Impara ora. Oggi 2 competenze su 5 sono sopra la mediana sia per slancio sia per domanda.');
  });
  it('business e politica', () => {
    expect(text(headBusiness(d, today).title)).toBe('Gli investimenti privati in AI 2,2 volte in un anno');
    expect(text(headPolitica(d, today).title)).toBe("48 giorni alla prossima scadenza dell'AI Act");
  });
  it('tesi della home e riserva', () => {
    expect(text(heroThesis(d, today))).toBe('Gli investimenti privati in AI sono 2,2 volte quelli di un anno fa. MCP entra tra le competenze da imparare ora.');
    expect(text(heroThesis({}, today))).toBe("Cosa succede nell'AI questa settimana.");
  });
  it('etichette dei tipi Hugging Face', () => {
    expect(tipoLabel('text-generation')).toBe('generazione di testo');
    expect(tipoLabel('sconosciuto')).toBe('sconosciuto');
  });
});
