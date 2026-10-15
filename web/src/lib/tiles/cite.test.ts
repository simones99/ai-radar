import { describe, expect, it } from 'vitest';
import type { OwidSeries } from '../data/types';
import { owidCite } from './cite';

const serie = (citazione: string, licenza?: string): OwidSeries =>
  ({ titolo: '', unita: '', citazione, url: 'https://ourworldindata.org/grapher/x', aggiornato_owid: null, punti: [], licenza });
const text = (c: ReturnType<typeof owidCite>) => c.map((p) => p.t).join('');

describe('owidCite', () => {
  it('citazione che nomina già OWID: niente "Elaborazione", OWID resta il link al grafico, licenza con link', () => {
    const c = owidCite(serie('Quid via AI Index Report (2026) – with major processing by Our World in Data', 'CC BY-ND 4.0'));
    expect(text(c)).not.toContain('Elaborazione');
    expect(c.find((p) => p.t === 'Our World in Data')?.href).toBe('https://ourworldindata.org/grapher/x');
    expect(c.find((p) => p.t === 'CC BY-ND 4.0')?.href).toBe('https://creativecommons.org/licenses/by-nd/4.0/');
  });
  it('citazione del solo produttore: elaborazione di OWID e licenza CC BY', () => {
    const c = owidCite(serie('Microsoft (2026)', 'CC BY 4.0'));
    expect(text(c)).toBe('Microsoft (2026). Elaborazione: Our World in Data. Licenza: CC BY 4.0.');
    expect(c.find((p) => p.t === 'CC BY 4.0')?.href).toBe('https://creativecommons.org/licenses/by/4.0/');
  });
  it('licenza senza testo pubblico: solo scritta; licenza assente: nessuna voce', () => {
    const c = owidCite(serie('NVIDIA Corporation (2026)', '© NVIDIA'));
    expect(c.find((p) => p.t === '© NVIDIA')?.href).toBeUndefined();
    expect(text(owidCite(serie('Microsoft (2026)')))).not.toContain('Licenza');
    expect(owidCite(undefined)).toEqual([]);
  });
});
