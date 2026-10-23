import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { Dataset, Geopoliticai } from '../data/types';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import { faceGeopoliticai, headGeopoliticai } from '../text/frasi';
import GeopoliticaiDetail from './GeopoliticaiDetail.svelte';
import type { TileDef } from './types';

const data = FIXTURE as Dataset;
const geo = data.geopoliticai as Geopoliticai;
const tile: TileDef = {
  id: 'geopoliticai', label: 'GeopoliticAI', source: 'geopoliticai', eager: false, testa: 'italia',
  face: faceGeopoliticai, head: headGeopoliticai, Detail: GeopoliticaiDetail,
};
const show = (d: Dataset = data) => render(GeopoliticaiDetail, { data: d, today, tile, elemento: null, params: {}, onclose: () => {} });
/** Il dataset con l'UE senza modelli valutati nell'anno in corso, come a gennaio. */
const ueSenzaAnnoInCorso = (): Dataset => {
  const { '2026': _, ...eci } = geo.zone.ue.eci;
  return { ...data, geopoliticai: { ...geo, zone: { ...geo.zone, ue: { ...geo.zone.ue, eci } } } };
};
const text = (parts: { t: string }[]) => parts.map((p) => p.t).join('');

describe('GeopoliticAI: card in home', () => {
  it("la capacità del miglior modello europeo, contro USA e Cina nell'anno in corso", () => {
    expect(faceGeopoliticai(data, today)).toEqual({
      fig: '150,0', unit: 'ECI',
      sent: 'Capacità del miglior modello europeo, Mistral Large 4, nel 2026, anno in corso. Gli USA arrivano a 168,8, la Cina a 157,9.',
    });
  });
  it("senza un valore UE nell'anno in corso, tutte e tre le aree passano all'ultimo anno chiuso", () => {
    expect(faceGeopoliticai(ueSenzaAnnoInCorso(), today)).toEqual({
      fig: '134,0', unit: 'ECI',
      sent: 'Capacità del miglior modello europeo, Mistral Medium 3, nel 2025. Gli USA arrivano a 156,3, la Cina a 146,1.',
    });
  });
  it('senza il file la card non ha un numero', () => {
    expect(faceGeopoliticai({}, today)).toBeNull();
    expect(text(headGeopoliticai({}, today).title)).toBe('GeopoliticAI');
  });
  it("la testa del dettaglio dice dov'è l'Europa", () => {
    const h = headGeopoliticai(data, today);
    expect(text(h.title)).toBe("Chi costruisce i modelli più potenti, e dov'è l'Europa");
    expect(h.title.find((p) => p.em)?.t).toBe("e dov'è l'Europa");
    expect(h.deck).toContain('prima organizzazione');
  });
});

describe('GeopoliticAI: la scheda dell’UE', () => {
  it('prima la capacità, poi il calcolo, con la distanza dal primo dello stesso anno', () => {
    show();
    expect(screen.getByRole('heading', { level: 3, name: 'UE' })).toBeInTheDocument();
    expect(screen.getByText('Il miglior modello europeo, Mistral Large 4, ha 150,0 ECI nel 2026, anno in corso: 18,8 punti sotto Claude Opus 5.5 (USA).').tagName).toBe('STRONG');
    const [cap, calc] = screen.getAllByRole('heading', { level: 4 });
    expect(cap).toHaveTextContent('Capacità');
    expect(calc).toHaveTextContent('Calcolo di addestramento');
    expect(screen.getByText('150,0')).toBeInTheDocument();
    expect(screen.getByText('Mistral Large 4, 2026, anno in corso')).toBeInTheDocument();
    expect(screen.getByText('1,2 × 10²⁴')).toBeInTheDocument();
    expect(screen.getByText('Mistral Small 3, 2025')).toBeInTheDocument();
    expect(screen.getByText('Calcolo: il più grande è Mistral Small 3, del 2025, con 1,2 × 10²⁴ FLOP. '
      + 'Il più grande del 2025, Grok 4 (USA), ne ha usati 430 volte tanto.')).toBeInTheDocument();
    expect(screen.getByText('2026, anno in corso: nessun modello di grande scala.')).toBeInTheDocument();
    expect(screen.getByText("Per l'UE l'ECI valuta solo Mistral AI.")).toBeInTheDocument();
  });
  it('sotto c’è la fonte di Epoch, con i link e la data', () => {
    const { container } = show();
    const cite = container.querySelector('.cite') as HTMLElement;
    expect(cite).toHaveTextContent('Fonte: Epoch AI, Data on AI models ed Epoch Capabilities Index (CC BY 4.0), aggregati per area da AI Radar. Dati scaricati il 15 ott 2026.');
    expect(screen.getByRole('link', { name: 'Data on AI models' })).toHaveAttribute('href', 'https://epoch.ai/data/ai-models');
    expect(screen.getByRole('link', { name: 'Epoch Capabilities Index' })).toHaveAttribute('href', 'https://epoch.ai/eci');
  });
  it('senza il file lo dice', () => {
    show({ ...data, geopoliticai: undefined });
    expect(screen.getByText('Dati di Epoch AI non disponibili in questo aggiornamento.')).toBeInTheDocument();
  });
});
