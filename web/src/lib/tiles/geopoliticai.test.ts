import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
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
const show = (d: Dataset = data, params: Record<string, string> = {}) => render(GeopoliticaiDetail, { data: d, today, tile, elemento: null, params, onclose: () => {} });
const area = (area: string, d: Dataset = data) => show(d, { area });
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

describe('GeopoliticAI: scegliere l’area', () => {
  beforeEach(() => localStorage.clear());

  it('l’area del link apre la sua scheda: gli USA sono i primi, contro la seconda area dello stesso anno', () => {
    area('usa');
    expect(screen.getByRole('heading', { level: 3, name: 'USA' })).toBeInTheDocument();
    expect(screen.getByText('Claude Opus 5.5 ha la capacità più alta del 2026, anno in corso: 168,8 ECI, 11,0 punti più del migliore della Cina.').tagName).toBe('STRONG');
    expect(screen.getByText('Calcolo: GPT-6 Astra, 9,4 × 10²⁶ FLOP nel 2026, anno in corso, 47 volte il più grande della Cina.')).toBeInTheDocument();
  });

  const aree = () => screen.getByRole('group', { name: 'Area' });
  const paesi = () => screen.getByRole('group', { name: "Paesi dell'UE" });
  const premuti = (g: HTMLElement) => within(g).getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent);
  /** Un Paese UE che nel file viene dopo l'Italia, in ordine di nome. */
  const conSpagna = (): Dataset => ({ ...data, geopoliticai: { ...geo, zone: { ...geo.zone, spagna: { ...geo.zone.germania, nome: 'Spagna', aggettivo: 'spagnolo', con_articolo: 'la Spagna' } } } });

  it('i pulsanti delle cinque aree; senza una scelta è in evidenza l’UE, con la fila dei suoi Paesi', () => {
    show();
    expect(within(aree()).getAllByRole('button').map((b) => b.textContent)).toEqual(['USA', 'Cina', 'UE', 'Regno Unito', 'Altri']);
    expect(premuti(aree())).toEqual(['UE']);
    expect(premuti(paesi())).toEqual(["Tutta l'UE"]);
  });

  it('nella fila dell’UE ci sono i Paesi del file, con l’Italia sempre in fondo', () => {
    area('francia', conSpagna());
    expect(within(paesi()).getAllByRole('button').map((b) => b.textContent)).toEqual(["Tutta l'UE", 'Francia', 'Germania', 'Spagna', 'Italia']);
    expect(premuti(aree())).toEqual(['UE']);
    expect(premuti(paesi())).toEqual(['Francia']);
    expect(screen.getByRole('heading', { level: 3, name: "Francia, nell'UE" })).toBeInTheDocument();
  });

  it('fuori dall’UE la fila dei Paesi non c’è', () => {
    area('cina');
    expect(premuti(aree())).toEqual(['Cina']);
    expect(screen.queryByRole('group', { name: "Paesi dell'UE" })).toBeNull();
  });

  it('prima in capacità ma non nel calcolo: la frase dice la prima, la riga del calcolo la distanza dal più grande', () => {
    const cina = { ...geo.zone.cina, eci: { ...geo.zone.cina.eci, '2026': { n: 33, max: 170.0, modello: 'Kimi K3' } } };
    area('cina', { ...data, geopoliticai: { ...geo, zone: { ...geo.zone, cina } } });
    expect(screen.getByText('Kimi K3 ha la capacità più alta del 2026, anno in corso: 170,0 ECI, 1,2 punti più del migliore degli USA.').tagName).toBe('STRONG');
    expect(screen.getByText('Calcolo: il più grande è Kimi K3, del 2026, anno in corso, con 2,0 × 10²⁵ FLOP. '
      + 'Il più grande del 2026, anno in corso, GPT-6 Astra (USA), ne ha usati 47 volte tanto.')).toBeInTheDocument();
  });

  it('capacità e calcolo in anni diversi: ogni riga ha il suo anno, e la distanza è dal primo di quell’anno', () => {
    area('francia');
    expect(screen.getByText('Il miglior modello francese, Mistral Large 4, ha 150,0 ECI nel 2026, anno in corso: 18,8 punti sotto Claude Opus 5.5 (USA).')).toBeInTheDocument();
    expect(screen.getByText('Mistral Large 4, 2026, anno in corso')).toBeInTheDocument();
    expect(screen.getByText('Mistral Small 3, 2025')).toBeInTheDocument();
    expect(screen.getByText('Calcolo: il più grande è Mistral Small 3, del 2025, con 1,2 × 10²⁴ FLOP. '
      + 'Il più grande del 2025, Grok 4 (USA), ne ha usati 430 volte tanto.')).toBeInTheDocument();
  });

  it('un’area non valida apre l’UE', () => {
    area('atlantide');
    expect(premuti(aree())).toEqual(['UE']);
    expect(screen.getByRole('heading', { level: 3, name: 'UE' })).toBeInTheDocument();
  });

  it('un clic sceglie l’area e la ricorda; «UE» toglie la scelta', async () => {
    show();
    await fireEvent.click(within(aree()).getByRole('button', { name: 'Regno Unito' }));
    expect(localStorage.getItem('ai-radar:area')).toBe('uk');
    await fireEvent.click(within(paesi()).getByRole('button', { name: 'Italia' }));
    expect(localStorage.getItem('ai-radar:area')).toBe('italia');
    await fireEvent.click(within(aree()).getByRole('button', { name: 'UE' }));
    expect(localStorage.getItem('ai-radar:area')).toBeNull();
  });
});

describe('GeopoliticAI: le righe di contesto', () => {
  beforeEach(() => localStorage.clear());

  it('UE: la copertura del calcolo sotto la cifra, le organizzazioni, i modelli che contano per un’altra area', () => {
    show();
    expect(screen.getByText('Calcolo noto per 3 dei 5 modelli di grande scala del 2025')).toBeInTheDocument();
    expect(screen.getByText("Per l'UE l'ECI valuta solo Mistral AI.")).toBeInTheDocument();
    expect(screen.queryByText(/i modelli di grande scala sono solo di/)).toBeNull(); // più di tre organizzazioni: non si nominano
    expect(screen.getByText("Dal 2020, 7 modelli con un'organizzazione europea contano per un'altra area, perché la prima organizzazione non è europea.")).toBeInTheDocument();
  });

  it('un Paese UE: le sue organizzazioni e i modelli che contano per un altro Paese', () => {
    area('francia');
    expect(screen.getByText('Calcolo noto per 1 dei 3 modelli di grande scala del 2025')).toBeInTheDocument();
    expect(screen.getByText("Per la Francia l'ECI valuta solo Mistral AI.")).toBeInTheDocument();
    expect(screen.getByText('Per la Francia i modelli di grande scala sono solo di LightOn e Mistral AI.')).toBeInTheDocument();
    expect(screen.getByText("Dal 2020, 5 modelli con un'organizzazione francese contano per un altro Paese, perché la prima organizzazione non è francese.")).toBeInTheDocument();
  });

  it('fuori dall’UE i modelli che contano altrove non si dicono; con lo zero neanche nell’UE', () => {
    area('usa');
    expect(screen.getByText('Calcolo noto per 9 dei 19 modelli di grande scala del 2026, anno in corso')).toBeInTheDocument();
    expect(screen.queryByText(/contano per/)).toBeNull();
    area('germania');
    expect(screen.queryByText(/contano per/)).toBeNull();
  });

  it('la copertura con tutti i modelli noti, o uno solo', () => {
    area('cina');
    expect(screen.getByText('Calcolo noto per tutti i 12 modelli di grande scala del 2026, anno in corso')).toBeInTheDocument();
    area('germania');
    expect(screen.getByText("Calcolo noto per l'unico modello di grande scala del 2025")).toBeInTheDocument();
  });
});


describe('GeopoliticAI: le schede con i vuoti', () => {
  beforeEach(() => localStorage.clear());
  /** Il dataset con una zona cambiata. */
  const con = (k: string, z: Partial<Geopoliticai['zone'][string]>): Dataset => ({ ...data, geopoliticai: { ...geo, zone: { ...geo.zone, [k]: { ...geo.zone[k], ...z } } } });

  it('È a zero: l’Italia apre con la nota, poi il riferimento europeo e il link alla mappa, senza cifre vuote', () => {
    area('italia');
    expect(screen.getByText('Epoch non conta nessun modello italiano: Minerva (Sapienza), Velvet (Almawave) e i modelli di iGenius non sono nel suo database.').tagName).toBe('STRONG');
    expect(screen.getByText("Nell'UE la frontiera è Mistral AI, in Francia: 150,0 ECI nel 2026, anno in corso.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Dove sta l'Italia nella catena dell'AI →" })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
    expect(screen.queryByText(/nessun modello (valutato|di grande scala)/i)).toBeNull();
  });

  it('Ha solo il calcolo: la Germania dice che l’ECI non la valuta, poi il calcolo con la distanza e le organizzazioni', () => {
    area('germania');
    expect(screen.getByText("Nessun modello tedesco è valutato dall'ECI.").tagName).toBe('STRONG');
    expect(screen.getByText('Il più grande è Teuken 7B, del 2025, con 2,1 × 10²³ FLOP. '
      + 'Il più grande del 2025, Grok 4 (USA), ne ha usati 2.300 volte tanto.')).toBeInTheDocument();
    expect(screen.getByText('Per la Germania i modelli di grande scala sono solo di Aleph Alpha e OpenGPT-X.')).toBeInTheDocument();
    expect(screen.getByText('nessun modello valutato')).toBeInTheDocument();
  });

  it('l’Italia con un modello non ha più la nota', () => {
    area('italia', con('italia', { calcolo: { '2025': { n: 1, nc: 1, max: 3e23, modello: 'Minerva 7B' } }, org_ls: ['Sapienza'] }));
    expect(screen.queryByText(/Minerva \(Sapienza\)/)).toBeNull();
    expect(screen.getByText("Nessun modello italiano è valutato dall'ECI.").tagName).toBe('STRONG');
    expect(screen.getByText('Minerva 7B, 2025')).toBeInTheDocument();
  });

  it('Ha solo il calcolo, con una capacità vecchia: «Altri» la nomina, e c’è la Corea del Sud', () => {
    area('altri');
    expect(screen.getByText("Dal 2025 l'ECI non valuta modelli di «Altri»: l'ultimo è Command R+, 119,2 nel 2024.").tagName).toBe('STRONG');
    expect(screen.getByText('Il più grande è EXAONE 4.5, del 2026, anno in corso, con 3,9 × 10²⁴ FLOP. '
      + 'Il più grande del 2026, anno in corso, GPT-6 Astra (USA), ne ha usati 240 volte tanto.')).toBeInTheDocument();
    expect(screen.getByText("Per «Altri» l'ECI valuta solo Cohere e Technology Innovation Institute.")).toBeInTheDocument();
    expect(screen.getByText('In «Altri» il Paese con più modelli di grande scala è la Corea del Sud: 22 dal 2020.')).toBeInTheDocument();
  });

  it('la Corea del Sud si nomina solo se è il Paese con più modelli di «Altri»', () => {
    area('altri', { ...data, geopoliticai: { ...geo, altri_paesi: { Canada: 30, 'South Korea': 22 } } });
    expect(screen.queryByText(/Corea del Sud/)).toBeNull();
  });

  it('Ha solo valori vecchi: il Regno Unito mostra gli ultimi, senza distanza dal primo, con la nota su DeepMind', () => {
    area('uk');
    expect(screen.getByText('Dal 2025 Epoch non ha modelli del Regno Unito, né valutati né di grande scala.').tagName).toBe('STRONG');
    expect(screen.getByText('Gli ultimi: Stable Beluga 2, 117,0 ECI nel 2023, e Stable LM 2 12B, 2,9 × 10²³ FLOP nel 2024.')).toBeInTheDocument();
    expect(screen.getByText('Epoch attribuisce Google DeepMind, che ha sede a Londra, agli USA: i suoi modelli contano lì.').tagName).toBe('EM');
    expect(screen.getByText('117,0')).toBeInTheDocument();
    expect(screen.getByText('Stable Beluga 2, 2023')).toBeInTheDocument();
    expect(screen.queryByText(/volte tanto|punti sotto|Calcolo:|anno in corso:/)).toBeNull();
  });

  it('il Regno Unito con un valore nell’ultimo anno chiuso perde la nota', () => {
    area('uk', con('uk', { eci: { ...geo.zone.uk.eci, '2025': { n: 1, max: 120.5, modello: 'Nuovo UK' } } }));
    expect(screen.queryByText(/Google DeepMind/)).toBeNull();
    expect(screen.getByText('Il miglior modello britannico, Nuovo UK, ha 120,5 ECI nel 2025: 35,8 punti sotto GPT-5.2 Pro (USA).')).toBeInTheDocument();
  });

  it('modelli di grande scala senza il calcolo noto: si dice quanti sono, mai 0 e mai una cella vuota', () => {
    area('germania', con('germania', { calcolo: { '2025': { n: 2, nc: 0, max: null, modello: null } } }));
    expect(screen.getByText('2 modelli di grande scala, senza il calcolo noto')).toBeInTheDocument();
    expect(screen.getByText('2 modelli di grande scala nel 2025, senza il calcolo noto.')).toBeInTheDocument();
    expect(screen.queryByText(/nessun modello di grande scala/i)).toBeNull();
  });

  it('un solo modello di grande scala senza il calcolo noto, al singolare', () => {
    area('germania', con('germania', { calcolo: { '2026': { n: 1, nc: 0, max: null, modello: null } } }));
    expect(screen.getByText('1 modello di grande scala, senza il calcolo noto')).toBeInTheDocument();
    expect(screen.getByText('1 modello di grande scala nel 2026, anno in corso, senza il calcolo noto.')).toBeInTheDocument();
  });
});

