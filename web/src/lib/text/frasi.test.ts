import { describe, expect, it } from 'vitest';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import type { Dataset } from '../data/types';
import {
  faceBusiness, faceCompetenze, faceModelli, faceNotizie, faceOpen, facePersone, facePolitica, faceRapporti,
  headBusiness, headCompetenze, headNotizie, headPolitica, heroThesis, tipoLabel,
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
  it('business: imprese UE che usano l’AI, valori Eurostat così come pubblicati', () => {
    expect(faceBusiness(d, today)).toEqual({ fig: '19,95', unit: '%', sent: "Imprese dell'UE che usano l'AI nel 2025. In Italia il 16,4%." });
    expect(faceBusiness({}, today)).toBeNull();
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
  it('notizie: le fonti contate sono quelle che hanno davvero notizie', () => {
    const news = { ...d.news!, fonti: [...d.news!.fonti, { nome: 'Feed muto', url: 'https://example.org/feed', tema: 'altro' }],
      notizie: d.news!.notizie.map((n) => ({ ...n, fonte: 'The Decoder' })) };
    expect(faceNotizie({ news }, today)?.sent).toBe('Notizie negli ultimi 7 giorni da 1 fonte.');
    expect(headNotizie({ news }, today).deck).toBe('Solo titolo, data e link agli articoli originali, da 1 fonte.');
    expect(headNotizie(d, today).deck).toBe('Solo titolo, data e link agli articoli originali, da 2 fonti.');
  });
  it('notizie: titolo di riserva senza dati', () => {
    expect(headNotizie({}, today)).toEqual({ title: [{ t: 'Notizie' }], deck: null });
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
    // serie CC BY-ND: importi brevi, nessun rapporto tra anni
    const hb = headBusiness(d, today);
    expect(text(hb.title)).toBe('Investimenti privati in AI nel 2025: 290 B $');
    expect(hb.deck).toBe('A prezzi 2021, in aziende AI non quotate. Nel 2024: 131 B $. B = miliardi.');
    expect(text(headPolitica(d, today).title)).toBe("48 giorni alla prossima scadenza dell'AI Act");
  });
  it('tesi della home e riserva', () => {
    expect(text(heroThesis(d, today))).toBe('Il modello più seguito della settimana su Hugging Face è embeddinggemma-2 di google. MCP entra tra le competenze da imparare ora.');
    expect(text(heroThesis({ ...d, radar: undefined }, today))).not.toMatch(/\d,\d/);
    expect(text(heroThesis({}, today))).toBe("Cosa succede nell'AI questa settimana.");
  });
  it('etichette dei tipi Hugging Face', () => {
    expect(tipoLabel('text-generation')).toBe('generazione di testo');
    expect(tipoLabel('sconosciuto')).toBe('sconosciuto');
  });
});
