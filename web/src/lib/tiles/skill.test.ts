import { render, screen, within } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { rigaPagina } from '../data/derive';
import type { Dataset, Radar } from '../data/types';
import type { Params } from '../router';
import { FIXTURE, FIXTURE_TODAY } from '../test/fixtures';
import { headCompetenze } from '../text/frasi';
import CompetenzeDetail from './CompetenzeDetail.svelte';
import SkillView from './SkillView.svelte';
import type { TileDef } from './types';

const data = FIXTURE as Dataset;
const radar = FIXTURE.radar as Radar;
const by = (id: string) => rigaPagina(radar, id)!;
const figs = (c: HTMLElement) => [...c.querySelectorAll('.fig')].map((e) => e.textContent);

describe('SkillView', () => {
  it('annunci: con il Paese a metà classifica sopra 10, l’Italia sotto la soglia tiene il decimale', () => {
    const row = by('mcp');
    const rilevazioni = [{ data: '2026-09-14', mediana: 12, it: 2.4 }, { data: '2026-10-12', mediana: 12.4, it: 2.6 }];
    render(SkillView, { row: { ...row, segnali: { ...row.segnali, lavoro: { ...row.segnali!.lavoro!, rilevazioni } } }, quadranti: radar.quadranti, storico: radar.storico });
    expect(screen.getByRole('img', { name: 'Annunci su MCP ogni 10mila' })).toHaveTextContent('2,6');
  });
  it('domanda e annunci parlano del Paese a metà classifica, non più di una media', () => {
    const { container } = render(SkillView, { row: by('mcp'), quadranti: radar.quadranti, storico: radar.storico });
    expect(screen.getByRole('region', { name: 'Domanda' })).toHaveTextContent('annunci ogni 10mila, il Paese a metà classifica');
    const annunci = screen.getByRole('region', { name: 'Annunci' });
    expect(annunci).toHaveTextContent('il Paese a metà classifica e l’Italia');
    expect(screen.getByRole('img', { name: 'Annunci su MCP ogni 10mila' })).toHaveTextContent('Paese a metà classifica 3,4');
    expect(container).not.toHaveTextContent(/\bmedia\b/i);
  });
  it('un margine che comprende lo zero lo dice accanto al numero', () => {
    render(SkillView, { row: { ...by('mcp'), slancio_margine: [-0.09, 0.32] }, quadranti: radar.quadranti, storico: radar.storico });
    expect(screen.getByText(/margine: da −9% a \+32%, include lo zero$/)).toBeInTheDocument();
  });
  it('tre numeri, tre andamenti, percorso e risorse', () => {
    const { container } = render(SkillView, { row: by('mcp'), quadranti: radar.quadranti, storico: radar.storico });
    expect(figs(container)).toEqual(['3,4', '+15%', 'normale']);
    expect(screen.getByText(/Italia: 2,6/)).toBeInTheDocument();
    expect(screen.getByText(/margine: da \+5% a \+27%$/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Incertezza del dato' })).toBeInTheDocument();
    expect(screen.getByText(/era [+−]\d+% un mese fa/)).toBeInTheDocument();
    expect(screen.getByText('pesa di più: repository su GitHub')).toBeInTheDocument();
    for (const name of ['Paper su MCP ogni 1.000 paper AI', 'Repository su MCP ogni 1.000 repository AI', 'Annunci su MCP ogni 10mila']) {
      expect(screen.getByRole('img', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: '← Tutte le competenze' })).toHaveAttribute('href', '#competenze');
    expect(screen.getByRole('link', { name: 'Documentazione ufficiale di MCP: introduzione' })).toHaveAttribute('target', '_blank');
    expect(screen.getByText('documentazione · in inglese')).toBeInTheDocument();
    expect(screen.getByText('corso')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'acme/mcp-kit' })).toHaveAttribute('href', 'https://github.com/acme/mcp-kit');
    expect(screen.getByText(/1\.200 stelle · creato il 2 ago 2026/)).toBeInTheDocument();
    const path = screen.getByRole('list', { name: 'Il percorso sul radar' });
    expect(path.querySelectorAll('li')).toHaveLength(3);
    expect(path.lastElementChild).toHaveTextContent('set 2026Impara ora');
    expect(screen.queryByRole('note')).toBeNull();
  });
  it('competenza incerta, senza risorse, con una sola rilevazione e senza storico', () => {
    const { container } = render(SkillView, { row: by('robotica'), quadranti: radar.quadranti, storico: [] });
    expect(screen.getByRole('note')).toHaveTextContent('Dato incerto: pochi paper (45 al mese). La posizione sul radar può cambiare molto.');
    expect(figs(container)[2]).toBe('alta');
    expect(screen.getByText('Nessuna risorsa disponibile.')).toBeInTheDocument();
    expect(screen.getByText('Nessun repository nuovo con questo topic negli ultimi 90 giorni.')).toBeInTheDocument();
    expect(screen.getByText('Serve un mese di rilevazioni.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'The Adzuna API' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'vedi il metodo' })).toHaveAttribute('href', '#competenze');
    expect(screen.getByText('Lo storico arriva con i prossimi aggiornamenti.')).toBeInTheDocument();
  });
});

describe('La pagina di una competenza segue il mercato', () => {
  const tile = { id: 'competenze', label: 'Competenze', source: 'owid', eager: false, testa: 'italia', face: () => null, head: headCompetenze, Detail: CompetenzeDetail } as TileDef;
  const pagina = (id: string, params: Params = {}, d: Dataset = data) =>
    render(CompetenzeDetail, { data: d, today: FIXTURE_TODAY, tile, elemento: id, params, onclose: () => {} });
  const italia = { mercato: 'italia' };
  const domanda = () => screen.getByRole('region', { name: 'Domanda' });
  const conCompetenza = (id: string, cambia: object) =>
    ({ ...data, radar: { ...radar, competenze: radar.competenze.map((c) => (c.id === id ? { ...c, ...cambia } : c)) } }) as Dataset;
  beforeEach(() => localStorage.clear());

  it('con «Tutti i Paesi» il blocco Domanda dice il Paese a metà classifica, con l’Italia accanto', () => {
    pagina('mcp');
    expect(domanda()).toHaveTextContent('3,4 annunci ogni 10mila, il Paese a metà classifica · era 3,4 un mese fa · Italia: 2,6');
  });
  it('con «Italia» il blocco Domanda dice il valore italiano, il conteggio e il Paese a metà classifica accanto', () => {
    pagina('mcp', italia);
    expect(domanda()).toHaveTextContent('2,6 ogni 10mila in Italia, 32 annunci · era 2,4 un mese fa · Paese a metà classifica: 3,4');
  });
  it('nella pagina non ci sono bottoni per scegliere: segue la scelta fatta', () => {
    pagina('mcp', italia);
    expect(screen.queryByRole('group', { name: 'Mercato' })).toBeNull();
  });
  it('un solo annuncio si dice al singolare', () => {
    pagina('mcp', italia, conCompetenza('mcp', { annunci_it: 1 }));
    expect(domanda()).toHaveTextContent('ogni 10mila in Italia, 1 annuncio ·');
  });
  for (const params of [{}, italia]) {
    it(`il grafico Annunci chiama le serie «Paese a metà classifica» e «Italia» e mostra le stesse rilevazioni ${params === italia ? 'con «Italia»' : 'con «Tutti i Paesi»'}`, () => {
      pagina('mcp', params);
      const annunci = screen.getByRole('region', { name: 'Annunci' });
      const grafico = within(annunci).getByRole('img', { name: 'Annunci su MCP ogni 10mila' });
      expect(grafico).toHaveTextContent('Paese a metà classifica 3,4');
      expect(grafico).toHaveTextContent('Italia 2,6');
      const tabella = within(annunci).getByRole('table');
      expect(within(tabella).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Rilevazione', 'Paese a metà classifica', 'Italia']);
      expect(within(tabella).getAllByRole('row')).toHaveLength(3); // l'intestazione e le due rilevazioni del FIXTURE
      expect(annunci).toHaveTextContent('Il numero in evidenza in Domanda è la mediana delle ultime 4 rilevazioni.');
    });
  }
  it('il percorso sul radar e il titolo usano i quadranti del mercato scelto', () => {
    const { unmount } = pagina('mcp');
    const percorso = () => within(screen.getByRole('list', { name: 'Il percorso sul radar' })).getAllByRole('listitem').map((li) => li.textContent);
    expect(percorso()).toEqual(['lug 2026Da consolidare', 'ago 2026Da consolidare', 'set 2026Impara ora']);
    expect(screen.getByText('Impara ora, un mese fa Da consolidare. Lo standard per collegare strumenti.')).toBeInTheDocument();
    unmount();
    pagina('mcp', italia);
    expect(percorso()).toEqual(["lug 2026Tieni d'occhio", "ago 2026Tieni d'occhio", 'set 2026Da provare']);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Model Context Protocol (MCP)');
    expect(screen.getByText("In Italia: Da provare, un mese fa Tieni d'occhio. Lo standard per collegare strumenti.")).toBeInTheDocument();
  });
  it('il titolo dice il movimento verso il quadrante italiano', () => {
    pagina('mcp', italia, conCompetenza('mcp', { quadrante_calcolato_it: 'impara-ora', quadrante_prec_it: 'prova' }));
    expect(screen.getByText('In Italia: Da provare, in movimento verso Impara ora. Lo standard per collegare strumenti.')).toBeInTheDocument();
  });
  describe('i link conservano la scelta', () => {
    const scelta = { mercato: 'italia', ruolo: 'dati' };
    const verso = '?mercato=italia&ruolo=dati';
    it('dalla pagina: «Tutte le competenze» e «vedi il metodo»', () => {
      pagina('mcp', scelta);
      expect(screen.getByRole('link', { name: '← Tutte le competenze' })).toHaveAttribute('href', `#competenze${verso}`);
      expect(screen.getByRole('link', { name: 'vedi il metodo' })).toHaveAttribute('href', `#competenze${verso}`);
    });
    it('verso la pagina: i punti del radar, i Movimenti e la tabella', () => {
      render(CompetenzeDetail, { data, today: FIXTURE_TODAY, tile, elemento: null, params: scelta, onclose: () => {} });
      const atteso = `#competenze/mcp${verso}`;
      expect(within(screen.getByRole('group', { name: /^Radar delle competenze/ })).getByRole('link', { name: /^Model Context Protocol/ })).toHaveAttribute('href', atteso);
      expect(within(screen.getByRole('region', { name: 'Radar delle competenze' })).getByRole('link', { name: /^MCP slancio/ })).toHaveAttribute('href', atteso);
      expect(within(screen.getByRole('region', { name: 'Tabella delle competenze' })).getByRole('link', { name: 'Model Context Protocol (MCP)' })).toHaveAttribute('href', atteso);
    });
    it('senza scelta i link restano puliti', () => {
      pagina('mcp');
      expect(screen.getByRole('link', { name: '← Tutte le competenze' })).toHaveAttribute('href', '#competenze');
    });
  });
  describe('senza il dato italiano', () => {
    const senzaItalia = conCompetenza('mcp', { domanda_it: null, annunci_it: null, quadrante_it: null, quadrante_calcolato_it: null, domanda_prec_it: null, quadrante_prec_it: null });
    const FRASE = 'Per l’Italia il dato non è disponibile in questo momento.';
    it('il blocco Domanda lo dice con una frase, mai uno zero', () => {
      pagina('mcp', italia, senzaItalia);
      expect(within(domanda()).getByText(FRASE)).toBeInTheDocument();
      expect(domanda()).not.toHaveTextContent(/\d/);
    });
    it('la pagina resta, e il titolo non dà il quadrante di tutti i Paesi per italiano', () => {
      pagina('mcp', italia, senzaItalia);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Model Context Protocol (MCP)');
      expect(screen.getByText(`${FRASE} Lo standard per collegare strumenti.`)).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Slancio' })).toHaveTextContent('+15%');
      expect(screen.queryByRole('group', { name: /^Radar delle competenze/ })).toBeNull();
    });
    it('un dato zero è un dato: si legge come tale', () => {
      pagina('mcp', italia, conCompetenza('mcp', { domanda_it: 0, annunci_it: 0 }));
      expect(domanda()).toHaveTextContent('0,0 ogni 10mila in Italia, 0 annunci');
    });
    it('senza quadranti italiani nello storico il percorso lo dice', () => {
      const storico = radar.storico!.map((p) => ({ ...p, competenze: Object.fromEntries(Object.entries(p.competenze).map(([k, v]) => [k, { ...v, pubblicato_it: null }])) }));
      const d = { ...senzaItalia, radar: { ...senzaItalia.radar!, storico } } as Dataset;
      pagina('mcp', italia, d);
      expect(screen.getByRole('region', { name: 'Il percorso sul radar' })).toHaveTextContent(FRASE);
      expect(screen.queryByRole('list', { name: 'Il percorso sul radar' })).toBeNull();
    });
  });
});
