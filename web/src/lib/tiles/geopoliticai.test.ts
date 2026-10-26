import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
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
/** La scheda dell'area, con il suo titolo: le cifre si cercano lì, perché la matrice ha gli stessi numeri. */
const laScheda = (titolo: string) => within(screen.getByRole('region', { name: titolo }));

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
    expect(laScheda('UE').getByText('150,0')).toBeInTheDocument();
    expect(screen.getByText('Mistral Large 4, 2026, anno in corso')).toBeInTheDocument();
    expect(laScheda('UE').getByText('1,2 × 10²⁴')).toBeInTheDocument();
    expect(screen.getByText('Mistral Small 3, 2025')).toBeInTheDocument();
    expect(screen.getByText('Calcolo: il più grande è Mistral Small 3, del 2025, con 1,2 × 10²⁴ FLOP. '
      + 'Il più grande del 2025, Grok 4 (USA), ne ha usati 430 volte tanto.')).toBeInTheDocument();
    expect(screen.getByText('2026, anno in corso: nessun modello di grande scala.')).toBeInTheDocument();
    expect(screen.getByText("Per l'UE l'ECI valuta solo Mistral AI.")).toBeInTheDocument();
  });
  it('la fonte di Epoch, con i link e la data, è una sola, sotto la matrice', () => {
    const { container } = show();
    const cite = container.querySelector('.cite') as HTMLElement;
    expect(cite).toHaveTextContent('Fonte: Epoch AI, Data on AI models ed Epoch Capabilities Index (CC BY 4.0), aggregati per area da AI Radar. Dati scaricati il 15 ott 2026.');
    expect(within(cite).getByRole('link', { name: 'Data on AI models' })).toHaveAttribute('href', 'https://epoch.ai/data/ai-models');
    expect(within(cite).getByRole('link', { name: 'Epoch Capabilities Index' })).toHaveAttribute('href', 'https://epoch.ai/eci');
    expect(screen.getAllByRole('link', { name: 'Data on AI models' })).toHaveLength(1);
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
    expect(laScheda("Italia, nell'UE").getByText('Epoch non conta nessun modello italiano: Minerva (Sapienza), Velvet (Almawave) e i modelli di iGenius non sono nel suo database.').tagName).toBe('STRONG');
    expect(screen.getByText("Nell'UE la frontiera è Mistral AI, in Francia: 150,0 ECI nel 2026, anno in corso.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Dove sta l'Italia nella catena dell'AI →" })).toBeInTheDocument();
    expect(laScheda("Italia, nell'UE").queryByRole('heading', { level: 4 })).toBeNull();
    expect(laScheda("Italia, nell'UE").queryByText(/nessun modello (valutato|di grande scala)/i)).toBeNull();
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
    expect(laScheda('Altri').queryByText(/Corea del Sud/)).toBeNull();
  });

  it('Ha solo valori vecchi: il Regno Unito mostra gli ultimi, senza distanza dal primo, con la nota su DeepMind', () => {
    area('uk');
    expect(screen.getByText('Dal 2025 Epoch non ha modelli del Regno Unito, né valutati né di grande scala.').tagName).toBe('STRONG');
    expect(screen.getByText('Gli ultimi: Stable Beluga 2, 117,0 ECI nel 2023, e Stable LM 2 12B, 2,9 × 10²³ FLOP nel 2024.')).toBeInTheDocument();
    expect(screen.getByText('Epoch attribuisce Google DeepMind, che ha sede a Londra, agli USA: i suoi modelli contano lì.').tagName).toBe('EM');
    expect(laScheda('Regno Unito').getByText('117,0')).toBeInTheDocument();
    expect(screen.getByText('Stable Beluga 2, 2023')).toBeInTheDocument();
    expect(laScheda('Regno Unito').queryByText(/volte tanto|punti sotto|Calcolo:|anno in corso:/)).toBeNull();
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


describe('GeopoliticAI: la matrice', () => {
  beforeEach(() => localStorage.clear());
  const matrice = () => screen.getByRole('table', { name: 'Calcolo e capacità per area, anno per anno' });
  const misura = () => screen.getByRole('group', { name: 'Misura' });
  const testate = () => within(matrice()).getAllByRole('columnheader').map((h) => h.textContent?.trim());
  const righe = () => within(matrice()).getAllByRole('rowheader').map((h) => h.textContent?.trim());

  it('parte sulla capacità: anni dal 2023, l’anno in corso marcato, le righe come i pulsanti', () => {
    show();
    expect(within(misura()).getByRole('button', { name: 'Capacità (ECI)' })).toHaveAttribute('aria-pressed', 'true');
    expect(testate()).toEqual(['Area', '2023', '2024', '2025', '2026 in corso']);
    expect(righe()).toEqual(['USA', 'Cina', 'UE', 'Francia', 'Germania', 'Italia', 'Regno Unito', 'Altri']);
    expect(within(matrice()).getByRole('cell', { name: '168,8 ECI, Claude Opus 5.5' })).toHaveTextContent(/^168,8$/);
    expect(within(matrice()).getByRole('cell', { name: '168,8 ECI, Claude Opus 5.5' })).toHaveAttribute('title', 'Claude Opus 5.5');
  });

  /** Le celle di una riga della matrice, una per anno. */
  const celle = (riga: string) => within(within(matrice()).getByRole('rowheader', { name: riga }).closest('tr') as HTMLElement).getAllByRole('cell');

  it('l’interruttore passa al calcolo: anni dal 2020, scritto come nella scheda', async () => {
    show();
    await fireEvent.click(within(misura()).getByRole('button', { name: 'Calcolo di addestramento (FLOP)' }));
    expect(within(misura()).getByRole('button', { name: 'Calcolo di addestramento (FLOP)' })).toHaveAttribute('aria-pressed', 'true');
    expect(testate()).toEqual(['Area', '2020', '2021', '2022', '2023', '2024', '2025', '2026 in corso']);
    const astra = within(matrice()).getByRole('cell', { name: '9,4 × 10²⁶ FLOP, GPT-6 Astra' });
    expect(astra).toHaveTextContent(/^9,4 × 10²⁶$/);
    expect(astra).toHaveAttribute('title', 'GPT-6 Astra');
  });

  it('le celle vuote con le regole brevi della scheda, mai vuote davvero', async () => {
    show();
    expect(celle('Germania')[0]).toHaveTextContent('nessuno');
    expect(celle('Germania')[0]).toHaveAccessibleName('nessun modello valutato');
    await fireEvent.click(within(misura()).getByRole('button', { name: 'Calcolo di addestramento (FLOP)' }));
    expect(celle('Germania')[0]).toHaveTextContent('nessuno');
    expect(celle('Germania')[0]).toHaveAccessibleName('nessun modello di grande scala');
    const uk2023 = celle('Regno Unito')[3];
    expect(uk2023).toHaveTextContent('1 senza calcolo');
    expect(uk2023).toHaveAccessibleName('1 modello di grande scala, senza il calcolo noto');
  });

  it('l’Italia a zero è una riga intera con la nota; con un modello torna alle celle', () => {
    show();
    expect(celle('Italia')).toHaveLength(1);
    expect(celle('Italia')[0]).toHaveTextContent('Epoch non conta nessun modello italiano: Minerva (Sapienza), Velvet (Almawave) e i modelli di iGenius non sono nel suo database.');
    expect(celle('Italia')[0]).toHaveAttribute('colspan', '4');
    cleanup();
    const italia = { ...geo.zone.italia, eci: { '2025': { n: 1, max: 101.5, modello: 'Velvet' } } };
    show({ ...data, geopoliticai: { ...geo, zone: { ...geo.zone, italia } } });
    expect(celle('Italia')).toHaveLength(4);
    expect(celle('Italia')[2]).toHaveAccessibleName('101,5 ECI, Velvet');
  });

  it('un clic su una riga sceglie l’area, la ricorda e dà il focus alla scheda', async () => {
    show();
    await fireEvent.click(within(matrice()).getByRole('button', { name: 'Cina' }));
    expect(localStorage.getItem('ai-radar:area')).toBe('cina');
    await waitFor(() => expect(screen.getByRole('region', { name: 'UE' })).toHaveFocus());
    await fireEvent.click(celle('Francia')[1]); // anche un clic su una cella sceglie la riga
    expect(localStorage.getItem('ai-radar:area')).toBe('francia');
    await fireEvent.click(within(matrice()).getByRole('button', { name: 'UE' }));
    expect(localStorage.getItem('ai-radar:area')).toBeNull();
  });

  it('sotto la matrice una nota sola: la misura, la copertura del calcolo, i modelli senza Paese, poi la fonte', async () => {
    const { container } = show();
    const nota = () => container.querySelector('.nota-matrice') as HTMLElement;
    expect(nota()).toHaveTextContent(
      "Capacità: l'Epoch Capabilities Index più alto tra i modelli usciti nell'anno, su tutti i modelli valutati, non solo quelli di grande scala. "
      + "Conta il confronto tra modelli, non il valore assoluto; il colore dice quanto l'area è vicina alla prima dell'anno, fino a 40 punti sotto. "
      + "Il calcolo è noto per 287 dei 487 modelli di grande scala delle aree, ed è spesso una stima di Epoch. "
      + '3 modelli valutati non hanno un Paese (Multinational o non indicato) e restano fuori dalle aree.');
    const cite = [...container.querySelectorAll('.cite')].at(-1) as HTMLElement;
    expect(nota().compareDocumentPosition(cite) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await fireEvent.click(within(misura()).getByRole('button', { name: 'Calcolo di addestramento (FLOP)' }));
    expect(nota()).toHaveTextContent(
      "Calcolo di addestramento: i FLOP del modello di grande scala più grande uscito nell'anno. "
      + "Il colore va in scala logaritmica: pieno per la prima area dell'anno, chiaro a mille volte meno. "
      + "Il calcolo è noto per 287 dei 487 modelli di grande scala delle aree, ed è spesso una stima di Epoch. "
      + '1 modello di grande scala non ha un Paese (Multinational o non indicato) e resta fuori dalle aree.');
  });
});


describe('GeopoliticAI: chi addestra i modelli di grande scala', () => {
  beforeEach(() => localStorage.clear());
  const blocco = () => within(screen.getByRole('heading', { level: 3, name: 'Chi addestra i modelli di grande scala' }).closest('section') as HTMLElement);
  const inEvidenza = () => blocco().getAllByRole('listitem').filter((li) => li.getAttribute('aria-current') === 'true').map((li) => li.textContent?.trim());

  it('una barra per anno con la quota delle cinque aree e il totale, l’area scelta in evidenza', () => {
    show();
    expect(blocco().getByText('Quota dei modelli di grande scala usciti ogni anno, per area. È un conteggio: non dice quanto sono potenti.')).toBeInTheDocument();
    const barre = blocco().getAllByRole('img');
    expect(barre.map((b) => b.getAttribute('aria-label')?.slice(0, 4))).toEqual(['2023', '2024', '2025', '2026']);
    const barra2025 = blocco().getByRole('img', { name: '2025: USA 66, Cina 84, UE 5, Regno Unito 0, Altri 10. Totale 165.' });
    expect(barra2025.nextElementSibling).toHaveTextContent(/^165$/); // il totale accanto alla barra
    expect(inEvidenza()).toEqual(['UE']);
  });

  it('con un Paese UE scelto è in evidenza l’UE; con un’altra area, quella', () => {
    area('francia');
    expect(inEvidenza()).toEqual(['UE']);
    cleanup();
    area('cina');
    expect(inEvidenza()).toEqual(['Cina']);
  });

  it('la frase sull’area scelta, sempre per l’ultimo anno chiuso', () => {
    show();
    expect(blocco().getByText("Nel 2025, 5 dei 165 modelli di grande scala sono dell'UE (3%).")).toBeInTheDocument();
    cleanup();
    area('usa');
    expect(blocco().getByText('Nel 2025, 66 dei 165 modelli di grande scala sono degli USA (40%).')).toBeInTheDocument();
  });

  it('per un Paese UE usa il suo nome; con un modello solo al singolare, sotto l’1% con un decimale', () => {
    area('francia');
    expect(blocco().getByText('Nel 2025, 3 dei 165 modelli di grande scala sono della Francia (2%).')).toBeInTheDocument();
    cleanup();
    area('germania');
    expect(blocco().getByText('Nel 2025, 1 dei 165 modelli di grande scala è della Germania (0,6%).')).toBeInTheDocument();
  });

  it('a zero lo dice a parole', () => {
    area('italia');
    expect(blocco().getByText("Nel 2025 nessuno dei 165 modelli di grande scala è dell'Italia.")).toBeInTheDocument();
  });
});


describe('GeopoliticAI: la mappa con l’anello dei modelli', () => {
  const mappa = () => within(screen.getByRole('region', { name: "Chi controlla la catena dell'AI" }));
  /** Il valore del tabellone sotto un'etichetta. */
  const cifra = (etichetta: string) => mappa().getByText(etichetta, { selector: 'dt' }).nextElementSibling;

  const linea = () => within(mappa().getByRole('navigation', { name: "Gli anelli della catena dell'AI" }));
  const fermate = () => linea().getAllByRole('listitem').map((li) => within(li).getByRole('button'));

  it('sei fermate: materie prime, chip e modelli sono attivi, le altre sono disabilitate e lo dicono', () => {
    show();
    expect(fermate().map((b) => b.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '1 Materie prime', '2 Progettazione dei chip', '3 Fabbricazione dei chip',
      '4 Macchinari', '5 Data center (in arrivo)', '6 Modelli',
    ]);
    expect(fermate().map((b) => (b as HTMLButtonElement).disabled)).toEqual([false, false, false, false, true, false]);
    expect(fermate()[5]).toHaveAttribute('aria-current', 'step');
    // dai modelli si torna indietro, saltando i data center che non ci sono ancora
    expect(linea().getByRole('button', { name: 'Anello precedente' })).toBeEnabled();
    expect(linea().getByRole('button', { name: 'Anello successivo' })).toBeDisabled();
  });

  it('senza il file della catena materie prime e chip restano disabilitati', () => {
    const { catena: _, ...senza } = data;
    show(senza, { anello: 'fabbricazione' });
    expect(mappa().getByRole('heading', { level: 4, name: '6. Modelli' })).toBeInTheDocument();
    expect(fermate().map((b) => (b as HTMLButtonElement).disabled)).toEqual([true, true, true, true, true, false]);
  });

  it('il titolo dell’anello ha numero, nome, misura, fonte e data', () => {
    show();
    expect(mappa().getByRole('heading', { level: 4, name: '6. Modelli' })).toBeInTheDocument();
    expect(mappa().getByText('ECI del miglior modello del 2025 · Epoch AI, dati scaricati il 15 ott 2026')).toBeInTheDocument();
  });

  it('un anello non valido, o non ancora attivo, apre i modelli', () => {
    show(data, { anello: 'datacenter' });
    expect(mappa().getByRole('heading', { level: 4, name: '6. Modelli' })).toBeInTheDocument();
    cleanup();
    show(data, { anello: 'boh' });
    expect(mappa().getByRole('heading', { level: 4, name: '6. Modelli' })).toBeInTheDocument();
  });

  it('il tabellone: il primo, l’UE e l’Italia, con le frasi oneste al posto dei vuoti', () => {
    show();
    expect(cifra('Il primo')).toHaveTextContent(/^USA 156,3 ECI GPT-5\.2 Pro$/);
    expect(cifra('UE')).toHaveTextContent(/^134,0 ECI Mistral Medium 3$/);
    expect(cifra('Italia')).toHaveTextContent(/^nessun modello valutato nel 2025$/);
    expect(mappa().getAllByText(/./, { selector: 'dt' }).map((d) => d.textContent)).toEqual(['Il primo', 'UE', 'Italia']);
  });

  it('il tabellone aggiunge l’area scelta, se non è già lì', () => {
    area('cina');
    expect(cifra('Cina')).toHaveTextContent(/^146,1 ECI DeepSeek-V3\.2$/);
    cleanup();
    area('germania');
    expect(cifra('Germania')).toHaveTextContent(/^nessun modello valutato nel 2025$/);
    cleanup();
    area('usa'); // gli USA sono già «Il primo»
    expect(mappa().getAllByText(/./, { selector: 'dt' }).map((d) => d.textContent)).toEqual(['Il primo', 'UE', 'Italia']);
  });

  it('la tabella dei Paesi dell’anello: Paese, valore, data', () => {
    show();
    const tabella = within(mappa().getByRole('table'));
    expect(tabella.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Paese', 'Valore', 'Data']);
    expect(tabella.getAllByRole('row').slice(1).map((r) => [...r.children].map((c) => c.textContent))).toEqual([
      ['USA', '156,3 ECI, GPT-5.2 Pro', '2025'],
      ['Cina', '146,1 ECI, DeepSeek-V3.2', '2025'],
      ['Francia', '134,0 ECI, Mistral Medium 3', '2025'],
    ]);
  });

  it('sulla mappa i numeri dei primi Paesi, con il segnalino accanto al primo', () => {
    show();
    const etichette = mappa().getAllByTestId('etichetta').map((e) => e.textContent?.replace(/\s+/g, ' ').trim());
    expect(etichette).toEqual(['USA 156,3', 'Cina 146,1', 'Francia 134,0']);
    expect(mappa().getByTestId('segnalino')).toHaveAccessibleName('Il primo: USA');
  });

  it('l’Italia nel riquadro dell’Europa: si può toccare, e sceglie l’Italia', async () => {
    const europa = () => within(mappa().getByRole('group', { name: 'Europa, ingrandita' }));
    const italia = () => europa().getByRole('button', { name: 'Italia: nessun modello valutato nel 2025' });
    const francia = () => europa().getByRole('button', { name: 'Francia: 134,0 ECI, Mistral Medium 3' });
    area('francia');
    expect(italia()).toHaveAttribute('aria-pressed', 'false');
    expect(francia()).toHaveAttribute('aria-pressed', 'true');
    const scelto = new Promise<CustomEvent>((ok) => document.addEventListener('ai-radar:imposta', (e) => ok(e as CustomEvent), { once: true }));
    await fireEvent.click(italia());
    expect((await scelto).detail).toEqual({ chiave: 'area', valore: 'italia' });
    cleanup();
    area('italia');
    expect(italia()).toHaveAttribute('aria-pressed', 'true');
    expect(francia()).toHaveAttribute('aria-pressed', 'false');
    cleanup();
    show(); // con tutta l'UE, l'Italia è dentro l'area scelta
    expect(italia()).toHaveAttribute('aria-pressed', 'true');
  });

  it('sotto la mappa le fonti e le licenze dell’anello aperto', () => {
    show();
    const fonte = mappa().getByText(/^Modelli: Epoch AI/);
    expect(fonte).toHaveTextContent("Modelli: Epoch AI, Epoch Capabilities Index (CC BY 4.0), ECI massimo per Paese aggregato da AI Radar. Confini: Natural Earth, pubblico dominio.");
    expect(within(fonte).getByRole('link', { name: 'Epoch Capabilities Index' })).toHaveAttribute('href', 'https://epoch.ai/eci');
  });
});

describe('GeopoliticAI: gli anelli dei chip', () => {
  const mappa = () => within(screen.getByRole('region', { name: "Chi controlla la catena dell'AI" }));
  const cifra = (etichetta: string) => mappa().getByText(etichetta, { selector: 'dt' }).nextElementSibling;
  const anello = (anello: string, extra: Record<string, string> = {}) => show(data, { anello, ...extra });

  it('?anello= apre progettazione, fabbricazione e macchinari, con misura, fonte e data', () => {
    anello('progettazione');
    expect(mappa().getByRole('heading', { level: 4, name: '2. Progettazione dei chip' })).toBeInTheDocument();
    expect(mappa().getByText('Quota del valore dei chip progettati, per sede dell’azienda · ETO, dati del 2022')).toBeInTheDocument();
    cleanup();
    anello('macchinari');
    expect(mappa().getByRole('heading', { level: 4, name: '4. Macchinari' })).toBeInTheDocument();
    expect(mappa().getByText('Quota del mercato delle macchine di litografia · ETO, dati del 2025')).toBeInTheDocument();
  });

  it('progettazione e fabbricazione: i Paesi UE con lo stesso valore, «Europa, dato unico», e la nota', () => {
    anello('fabbricazione');
    const europa = within(mappa().getByRole('group', { name: 'Europa, ingrandita' }));
    expect(europa.getByRole('button', { name: 'Italia: Europa, dato unico, 8%' })).toBeInTheDocument();
    expect(europa.getByRole('button', { name: 'Francia: Europa, dato unico, 8%' })).toBeInTheDocument();
    expect(cifra('UE')).toHaveTextContent(/^8% Europa, dato unico$/);
    expect(cifra('Italia')).toHaveTextContent(/^8% Europa, dato unico$/);
    expect(mappa().getByText(/^Europa, dato unico: la fonte dà 8% per l'Europa intera/)).toBeInTheDocument();
    expect(mappa().queryByText(/EUV/)).toBeNull();
  });

  it('macchinari: ogni Paese UE ha il suo valore, l’UE è la loro somma, e c’è la nota EUV', () => {
    anello('macchinari');
    const europa = within(mappa().getByRole('group', { name: 'Europa, ingrandita' }));
    expect(europa.getByRole('button', { name: 'Italia: nessuna produzione' })).toBeInTheDocument();
    expect(cifra('Il primo')).toHaveTextContent(/^Paesi Bassi 81,5%$/);
    expect(cifra('UE')).toHaveTextContent(/^83,1%$/);
    expect(cifra('Italia')).toHaveTextContent(/^nessuna produzione$/);
    expect(mappa().getByText('Le macchine EUV, necessarie per i chip più avanzati, le fa solo ASML nei Paesi Bassi.')).toBeInTheDocument();
    expect(mappa().queryByText(/dato unico/)).toBeNull();
  });

  it('il tabellone con l’area scelta, e le frasi oneste dove la fonte non ha il Paese', () => {
    anello('fabbricazione', { area: 'uk' });
    expect(cifra('Il primo')).toHaveTextContent(/^Cina 24%$/);
    expect(cifra('Regno Unito')).toHaveTextContent(/^nessuno stabilimento$/);
    cleanup();
    anello('progettazione', { area: 'altri' });
    expect(cifra('Altri')).toHaveTextContent(/^30%$/); // Corea, Giappone e Taiwan
  });

  it('la tabella dei Paesi dell’anello, con la riga dell’Europa al suo posto', () => {
    anello('progettazione');
    const tabella = within(mappa().getByRole('table'));
    expect(tabella.getAllByRole('row').slice(1).map((r) => [...r.children].map((c) => c.textContent))).toEqual([
      ['USA', '51%', '2022'], ['Corea del Sud', '13%', '2022'], ['Europa, dato unico', '10%', '2022'],
      ['Giappone', '9%', '2022'], ['Taiwan', '8%', '2022'], ['Cina', '6%', '2022'],
    ]);
  });

  it('sulla mappa i numeri dei primi, con l’Europa tra loro e il segnalino sul primo Paese', () => {
    anello('progettazione');
    const etichette = mappa().getAllByTestId('etichetta').map((e) => e.textContent?.replace(/\s+/g, ' ').trim());
    expect(etichette).toEqual(['USA 51%', 'Corea del Sud 13%', 'Europa 10%', 'Giappone 9%', 'Taiwan 8%']);
    expect(mappa().getByTestId('segnalino')).toHaveAccessibleName('Il primo: USA');
  });

  it('sotto la mappa l’attribuzione di ETO, con la CC BY-NC e il divieto di uso commerciale', () => {
    anello('macchinari');
    const fonte = mappa().getByText(/^Macchinari: ETO/);
    expect(fonte).toHaveTextContent('Macchinari: ETO, Advanced Semiconductor Supply Chain Dataset (CC BY-NC 4.0, uso commerciale non consentito), dati del 2025, quote rielaborate da AI Radar. Confini: Natural Earth, pubblico dominio.');
    expect(within(fonte).getByRole('link', { name: 'CC BY-NC 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-nc/4.0/');
    expect(within(fonte).getByRole('link', { name: 'Advanced Semiconductor Supply Chain Dataset' })).toHaveAttribute('href', 'https://eto.tech/dataset-docs/chipexplorer');
  });
});

describe('GeopoliticAI: l’anello delle materie prime', () => {
  const mappa = () => within(screen.getByRole('region', { name: "Chi controlla la catena dell'AI" }));
  const cifra = (etichetta: string) => mappa().getByText(etichetta, { selector: 'dt' }).nextElementSibling;
  const materiali = () => within(mappa().getByRole('group', { name: 'Materiale' }));
  const premuto = () => materiali().getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent);

  it('si apre sul gallio, con il selettore dei materiali nel titolo dell’anello', () => {
    show(data, { anello: 'materie' });
    expect(mappa().getByRole('heading', { level: 4, name: '1. Materie prime' })).toBeInTheDocument();
    expect(materiali().getAllByRole('button').map((b) => b.textContent)).toEqual(['Gallio', 'Terre rare', 'Germanio']);
    expect(premuto()).toEqual(['Gallio']);
    expect(mappa().getByText('Quota della produzione primaria mondiale, stima del 2025 · USGS, dati del 2025')).toBeInTheDocument();
    expect(cifra('Il primo')).toHaveTextContent(/^Cina 99%$/);
  });

  it('?materiale= sceglie il materiale, e un valore non valido torna al gallio', () => {
    show(data, { anello: 'materie', materiale: 'terre' });
    expect(premuto()).toEqual(['Terre rare']);
    expect(cifra('Il primo')).toHaveTextContent(/^Cina 69,2%$/);
    cleanup();
    show(data, { anello: 'materie', materiale: 'oro' });
    expect(premuto()).toEqual(['Gallio']);
  });

  it('un clic su un materiale lo mette nel link', async () => {
    show(data, { anello: 'materie' });
    const scelto = new Promise<CustomEvent>((ok) => document.addEventListener('ai-radar:imposta', (e) => ok(e as CustomEvent), { once: true }));
    await fireEvent.click(materiali().getByRole('button', { name: 'Germanio' }));
    expect((await scelto).detail).toEqual({ chiave: 'materiale', valore: 'germanio' });
  });

  it('mappa, tabellone, tabella e fonte seguono il materiale, e l’Italia ha la sua frase onesta', () => {
    show(data, { anello: 'materie', materiale: 'germanio' });
    const europa = within(mappa().getByRole('group', { name: 'Europa, ingrandita' }));
    expect(europa.getByRole('button', { name: 'Italia: nessuna produzione' })).toBeInTheDocument();
    expect(cifra('Italia')).toHaveTextContent(/^nessuna produzione$/);
    expect(cifra('UE')).toHaveTextContent(/^7,2%$/); // Belgio e Germania
    const tabella = within(mappa().getByRole('table'));
    expect(tabella.getAllByRole('row').slice(1).map((r) => [...r.children].map((c) => c.textContent))).toEqual([
      ['Cina', '83,1%', '2016-2020'], ['Russia', '5%', '2016-2020'], ['Belgio', '4,5%', '2016-2020'], ['Germania', '2,7%', '2016-2020'],
    ]);
    const fonte = mappa().getByText(/^Materie prime, germanio:/);
    expect(fonte).toHaveTextContent('Materie prime, germanio: Commissione europea, Study on the critical raw materials for the EU 2023 (CC BY 4.0), dati del 2016-2020, quote rielaborate da AI Radar. Confini: Natural Earth, pubblico dominio.');
    expect(mappa().queryByText(/uso commerciale/)).toBeNull();
  });
});
