import { describe, expect, it } from 'vitest';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import type { Dataset } from '../data/types';
import {
  faceBusiness, faceCompetenze, faceModelli, faceNotizie, faceOpen, facePersone, faceNorme, faceRapporti,
  cambio, headBusiness, headCompetenze, headNotizie, headNorme, headPersone, headSkill, tipoLabel,
} from './frasi';
import { radarRows } from '../data/derive';

const d = FIXTURE as Dataset;
const text = (parts: { t: string }[]) => parts.map((p) => p.t).join('');

describe('numeri chiave delle card', () => {
  it('modelli: crescita del calcolo', () => {
    expect(faceModelli(d, today)).toEqual({ fig: '×4,8', unit: "all'anno", sent: 'Quanto cresce il calcolo per addestrare i modelli più grandi, dal 2018.' });
    expect(faceModelli({}, today)).toBeNull();
  });
  it('open source: tipo più frequente, senza contare "altro"', () => {
    expect(faceOpen(d, today)).toEqual({ fig: '37', unit: 'su 100', sent: 'Modelli di tendenza su Hugging Face di tipo «immagine e testo».' });
  });
  it('business: prima l’Italia, numeri interi, UE nella frase', () => {
    expect(faceBusiness(d, today)).toEqual({ fig: '16', unit: '%', sent: "Imprese italiane che usano l'AI nel 2025. UE: 20%." });
    const senzaIt = { eurostat: { ...d.eurostat!, serie: { EU27_2020: d.eurostat!.serie.EU27_2020 } } };
    expect(faceBusiness(senzaIt, today)).toEqual({ fig: '20', unit: '%', sent: "Imprese dell'UE che usano l'AI nel 2025; manca il dato italiano." });
    expect(faceBusiness({}, today)).toBeNull();
  });
  it('persone: prima l’Italia, mondo nella frase', () => {
    expect(facePersone(d, today)).toEqual({ fig: '30', unit: '%', sent: "Italiani che usano l'AI generativa. Mondo: 18%." });
    const senzaIt = { owid: { ...d.owid!, serie: { uso_genai: { ...d.owid!.serie.uso_genai, punti: d.owid!.serie.uso_genai.punti.filter((p) => p.entita === 'World') } } } };
    expect(facePersone(senzaIt, today)).toEqual({ fig: '18', unit: '%', sent: "Persone nel mondo che usano l'AI generativa; manca il dato italiano." });
  });
  it('norme: giorni alla prossima scadenza, e nessuna scadenza', () => {
    expect(faceNorme(d, today)).toEqual({ fig: '48', unit: 'giorni', sent: "Alla prossima scadenza dell'AI Act, il 2 dic 2026: fine della transizione per la marcatura." });
    const late = new Date(2029, 0, 1);
    expect(faceNorme(d, late)).toEqual({ fig: '0', unit: 'scadenze in arrivo', sent: "Nessuna scadenza dell'AI Act in arrivo." });
  });
  it('competenze: la card dice quante sono, chi entra lo dice la porta', () => {
    expect(faceCompetenze(d, today)).toEqual({ fig: '2', unit: 'su 5', sent: "2 competenze su 5 da imparare ora: crescono più dell'AI e hanno almeno 3 annunci ogni 10mila." });
  });
  it('competenze: nomi plurali, verbo al plurale anche da soli', () => {
    const comp = d.radar!.competenze.map((r) => (r.id === 'mcp' ? { ...r, breve: 'Multimodali', plurale: true } : r.id === 'rag' ? { ...r, breve: 'DB vettoriali', plurale: true } : r));
    const pl: Dataset = { radar: { ...d.radar!, competenze: comp } };
    const h = headCompetenze(pl, today);
    expect(text(h.title)).toBe('Multimodali entrano tra le competenze da imparare ora');
    expect(h.deck).toBe("DB vettoriali escono da Impara ora. Multimodali: in Italia 2,6 annunci ogni 10mila, sotto soglia. Oggi 2 competenze su 5 crescono più dell'AI e hanno almeno 3 annunci ogni 10mila.");
  });
  it('competenze: chi torna in Impara ora con un margine che comprende lo zero: il titolo dice «tornano», il sottotitolo dice il margine', () => {
    const pt = (pubblicato: 'impara-ora' | 'consolida') => ({ slancio: 0, domanda: 1, calcolato: pubblicato, pubblicato, incerto: false });
    const comp = d.radar!.competenze.map((r) => (r.id === 'mcp' ? { ...r, breve: 'Multimodali', plurale: true, slancio_margine: [-0.09, 0.32] as [number, number] } : r));
    const storico = (['impara-ora', 'consolida', 'consolida', 'impara-ora'] as const).map((q, i) => ({ mese: `2026-0${i + 6}`, competenze: { mcp: pt(q) } }));
    const h = headCompetenze({ radar: { ...d.radar!, competenze: comp, storico } }, today);
    expect(text(h.title)).toBe('Multimodali tornano tra le competenze da imparare ora');
    expect(h.deck).toMatch(/^RAG esce da Impara ora\. Il margine di Multimodali, da −9% a \+32%, include lo zero: potrebbero non crescere più dell'AI\. Multimodali: in Italia 2,6 annunci ogni 10mila, sotto soglia\. Oggi /);
    const q = d.radar!.quadranti;
    expect(cambio(radarRows({ ...d.radar!, competenze: comp, storico }).find((r) => r.id === 'mcp')!, q)).toBe('tornano in Impara ora');
  });
  it('competenze: etichetta del cambio sul radar, al plurale con i nomi plurali', () => {
    const q = d.radar!.quadranti;
    const rows = radarRows(d.radar!);
    const by = (id: string) => rows.find((r) => r.id === id)!;
    expect(cambio(by('mcp'), q)).toBe('entra in Impara ora');
    expect(cambio(by('rag'), q)).toBe('esce da Impara ora');
    expect(cambio({ ...by('mcp'), plurale: true }, q)).toBe('entrano in Impara ora');
    expect(cambio({ ...by('rag'), plurale: true }, q)).toBe('escono da Impara ora');
    const passa = { ...by('vector-db'), quadrante: 'prova' as const, qp: 'osserva' as const };
    expect(cambio(passa, q)).toBe('passano a Da provare');
    expect(cambio({ ...passa, plurale: false }, q)).toBe('passa a Da provare');
  });
  it('competenze: senza posizione precedente, e radar della pipeline vecchia', () => {
    const noPrev: Dataset = { radar: { ...d.radar!, competenze: d.radar!.competenze.map(({ slancio_prec, domanda_prec, quadrante_prec, breve, ...r }) => r) } };
    expect(faceCompetenze(noPrev, today)?.fig).toBe('2');
    expect(faceCompetenze({ radar: { ...d.radar!, versione: undefined } }, today)).toBeNull();
  });
  it('competenze: con le sole uscite il titolo dice chi esce, come la porta che ci porta', () => {
    const senza = (...ids: string[]): Dataset => ({ radar: { ...d.radar!, competenze: d.radar!.competenze.filter((r) => !ids.includes(r.id)) } });
    const h = headCompetenze(senza('mcp'), today);
    expect(text(h.title)).toBe('RAG esce da Impara ora');
    expect(h.title[0]).toEqual({ t: 'RAG', em: true });
    expect(h.deck).not.toContain('RAG'); // lo dice già il titolo
    expect(text(headCompetenze(senza('mcp', 'rag'), today).title)).toBe('Nessun cambio tra le competenze da imparare ora');
  });
  it('competenze: chi entra sotto soglia in Italia lo dice anche il sottotitolo, come la porta', () => {
    expect(headCompetenze(d, today).deck).toContain('MCP: in Italia 2,6 annunci ogni 10mila, sotto soglia. ');
  });
  it('competenze: una sola da imparare ora, verbo al singolare', () => {
    const one: Dataset = { radar: { ...d.radar!, competenze: d.radar!.competenze.filter((r) => r.id !== 'agenti') } };
    expect(headCompetenze(one, today).deck).toBe("RAG esce da Impara ora. MCP: in Italia 2,6 annunci ogni 10mila, sotto soglia. Oggi 1 competenza su 4 cresce più dell'AI e ha almeno 3 annunci ogni 10mila.");
    expect(faceCompetenze(one, today)?.sent).toBe("1 competenza su 4 da imparare ora: cresce più dell'AI e ha almeno 3 annunci ogni 10mila.");
  });
  it('competenze: chi resta in Impara ora ma per il calcolo è altrove non «cresce più dell’AI»', () => {
    const conAgenti = (r: object): Dataset => ({ radar: { ...d.radar!, competenze: d.radar!.competenze.map((c) => (c.id === 'agenti' ? { ...c, ...r } : c)) } });
    const giu = conAgenti({ breve: 'LLMOps', plurale: false, slancio: -0.34, quadrante_calcolato: 'consolida' });
    expect(headCompetenze(giu, today).deck).toContain('Oggi 2 competenze su 5 sono in Impara ora; LLMOps sta perdendo slancio (−34%) e può uscirne.');
    expect(headCompetenze(giu, today).deck).not.toContain("crescono più dell'AI");
    const pochi = conAgenti({ breve: 'Multimodali', plurale: true, quadrante_calcolato: 'prova' });
    expect(headCompetenze(pochi, today).deck).toContain('Multimodali hanno meno di 3 annunci ogni 10mila e possono uscirne.');
    const senzaCambi = { radar: { ...giu.radar!, competenze: giu.radar!.competenze.map(({ slancio_prec, domanda_prec, quadrante_prec, ...r }) => r) } };
    expect(faceCompetenze(senzaCambi, today)?.sent).toBe('2 competenze su 5 da imparare ora; LLMOps sta perdendo slancio (−34%) e può uscirne.');
  });
  it('pagina di una competenza: nome nel titolo, quadrante e movimento nel sottotitolo', () => {
    const rows = radarRows(d.radar!);
    const by = (id: string) => rows.find((r) => r.id === id)!;
    expect(headSkill(by('mcp'), d.radar!.quadranti)).toEqual({ title: [{ t: 'Model Context Protocol (MCP)' }], deck: 'Impara ora, un mese fa Da consolidare. Lo standard per collegare strumenti.' });
    expect(headSkill(by('vector-db'), d.radar!.quadranti).deck).toBe("Tieni d'occhio, in movimento verso Da provare. Indici.");
  });
  it('pagina di una competenza: sotto la descrizione, per quali ruoli conta, nell’ordine dei ruoli', () => {
    const rows = radarRows(d.radar!);
    const by = (id: string) => rows.find((r) => r.id === id)!;
    expect(headSkill(by('rag'), d.radar!.quadranti, d.radar!.ruoli).nota).toBe('Conta per: Sviluppo software, Prodotto, Dati e analisi');
    expect(headSkill(by('robotica'), d.radar!.quadranti, d.radar!.ruoli)).not.toHaveProperty('nota'); // non conta per nessun ruolo
    expect(headSkill(by('agenti'), d.radar!.quadranti, d.radar!.ruoli)).not.toHaveProperty('nota'); // radar senza il campo ruoli
    expect(headSkill(by('rag'), d.radar!.quadranti)).not.toHaveProperty('nota'); // radar senza elenco dei ruoli
  });
  it('notizie: i 7 giorni fino all’ultimo aggiornamento, e nessuna notizia in quei giorni', () => {
    expect(faceNotizie(d)).toEqual({ fig: '2', unit: '', sent: 'Notizie nei 7 giorni fino al 15 ott 2026, da 2 fonti.' });
    expect(headNotizie(d).title).toEqual([{ t: '2', em: true }, { t: ' notizie nei 7 giorni fino al 15 ott 2026' }]);
    const dopo = { ...d, status: { ...d.status!, aggiornato: '2026-12-01T05:17:00+00:00' } };
    expect(faceNotizie(dopo)).toEqual({ fig: '0', unit: '', sent: 'Nessuna notizia nei 7 giorni fino all’1 dic 2026.' });
  });
  it('notizie: senza lo stato delle fonti, la settimana finisce con la notizia più recente', () => {
    expect(faceNotizie({ news: d.news })?.sent).toBe('Notizie nei 7 giorni fino al 14 ott 2026, da 2 fonti.');
    expect(faceNotizie({ news: { ...d.news!, notizie: [] } })?.sent).toBe('Nessuna notizia nei 7 giorni.');
  });
  it('notizie: le fonti contate sono quelle che hanno davvero notizie', () => {
    const news = { ...d.news!, fonti: [...d.news!.fonti, { nome: 'Feed muto', url: 'https://example.org/feed', tema: 'altro' }],
      notizie: d.news!.notizie.map((n) => ({ ...n, fonte: 'The Decoder' })) };
    expect(faceNotizie({ news, status: d.status })?.sent).toBe('Notizie nei 7 giorni fino al 15 ott 2026, da 1 fonte.');
    expect(headNotizie({ news }).deck).toBe("Solo titolo, data e link agli articoli originali. L'elenco copre gli ultimi 45 giorni, da 1 fonte.");
    expect(headNotizie(d).deck).toBe("Solo titolo, data e link agli articoli originali. L'elenco copre gli ultimi 45 giorni, da 2 fonti.");
  });
  it('notizie: titolo di riserva senza dati', () => {
    expect(headNotizie({})).toEqual({ title: [{ t: 'Notizie' }], deck: null });
  });
  it('rapporti: prossimo previsto', () => {
    expect(faceRapporti(d, today)).toEqual({ fig: 'Ottobre', unit: '2026', sent: 'Prossimo rapporto previsto: State of AI Report.' });
    expect(faceRapporti(d, new Date(2028, 0, 1))?.sent).toBe('Nessun rapporto previsto nei prossimi mesi.');
  });
});

describe('articolo prima del giorno', () => {
  const genai = (punti: { entita: string; t: string; v: number }[]): Dataset =>
    ({ owid: { ...d.owid!, serie: { ...d.owid!.serie, uso_genai: { ...d.owid!.serie.uso_genai, punti } } } });
  const scad = (data: string): Dataset => ({ ai_act: { scadenze: [{ ...d.ai_act!.scadenze[1], data }] } });
  it('persone: «al 31», «all’8»', () => {
    expect(headPersone(d, today).deck).toBe('Nel mondo il 18%. Stima di Microsoft al 31 mar 2026.');
    expect(headPersone(genai([{ entita: 'World', t: '2026-04-08', v: 17.8 }, { entita: 'Italy', t: '2026-04-08', v: 30.2 }]), today).deck)
      .toBe('Nel mondo il 18%. Stima di Microsoft all’8 apr 2026.');
    expect(headPersone(genai([{ entita: 'World', t: '2026-04-11', v: 17.8 }]), today).deck)
      .toBe('Manca il dato italiano. Stima di Microsoft all’11 apr 2026.');
  });
  it('norme: «il 2», «l’11», e «L’11» a inizio frase', () => {
    expect(faceNorme(scad('2026-12-11'), today)?.sent).toBe("Alla prossima scadenza dell'AI Act, l’11 dic 2026: fine della transizione per la marcatura.");
    expect(headNorme(d, today).deck).toBe('Il 2 dic 2026: fine della transizione per la marcatura. Articolo 50(2).');
    expect(headNorme(scad('2026-12-11'), today).deck).toBe('L’11 dic 2026: fine della transizione per la marcatura. Articolo 50(2).');
    expect(headNorme(scad('2026-12-08'), today).deck).toBe('L’8 dic 2026: fine della transizione per la marcatura. Articolo 50(2).');
  });
});

describe('titoli', () => {
  it('competenze', () => {
    const h = headCompetenze(d, today);
    expect(text(h.title)).toBe('MCP entra tra le competenze da imparare ora');
    expect(h.title[0]).toEqual({ t: 'MCP', em: true });
    expect(h.deck).toBe("RAG esce da Impara ora. MCP: in Italia 2,6 annunci ogni 10mila, sotto soglia. Oggi 2 competenze su 5 crescono più dell'AI e hanno almeno 3 annunci ogni 10mila.");
  });
  it('business e norme', () => {
    const hb = headBusiness(d, today);
    expect(text(hb.title)).toBe("16% delle imprese italiane usa l'AI");
    expect(hb.title[0]).toEqual({ t: '16%', em: true });
    expect(hb.deck).toBe("Nel 2025, imprese con almeno 10 addetti. UE: 20%. Nel 2024 in Italia l'8%.");
    // senza Eurostat resta il titolo sugli investimenti (serie CC BY-ND: importi brevi)
    const senzaEu = { ...d, eurostat: undefined };
    expect(text(headBusiness(senzaEu, today).title)).toBe('Investimenti privati in AI nel 2025: 290 B $');
    expect(text(headNorme(d, today).title)).toBe("48 giorni alla prossima scadenza dell'AI Act");
  });
  it('etichette dei tipi Hugging Face', () => {
    expect(tipoLabel('text-generation')).toBe('generazione di testo');
    expect(tipoLabel('image-to-video')).toBe('da immagine a video');
    expect(tipoLabel('sconosciuto')).toBe('sconosciuto');
  });
});
