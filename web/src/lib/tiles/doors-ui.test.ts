import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { ruolo, settore } from '../scelta.svelte';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import Doors from './Doors.svelte';

describe('Doors', () => {
  it('due porte come link alla card della notizia', () => {
    render(Doors, { data: FIXTURE as Dataset, today });
    const perTe = screen.getByRole('link', { name: /Per te.*Su cosa formarti.*Agenti AI crescono più di tutte/ });
    expect(perTe).toHaveAttribute('href', '#competenze/agenti');
    expect(perTe.querySelector('em')).toHaveTextContent('Agenti AI');
    const italia = screen.getByRole('link', { name: /Per la tua organizzazione.*L'AI in Italia.*Nessuno dei 35 modelli di grande scala/ });
    expect(italia).toHaveAttribute('href', '#geopoliticai?area=ue');
    expect(screen.getByText('Radar delle competenze · dati al 15 ott 2026')).toBeInTheDocument();
  });
  it('senza dati: porte non cliccabili che lo dicono', () => {
    render(Doors, { data: {}, today });
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getAllByText('Dati non ancora disponibili')).toHaveLength(2);
    expect(screen.getByText('Su cosa formarti')).toBeInTheDocument();
  });

  describe('con un ruolo ricordato', () => {
    beforeEach(() => ruolo.scegli(null));
    it('l’etichetta dice il ruolo e il link apre la card con il ruolo', () => {
      ruolo.scegli('prodotto');
      render(Doors, { data: FIXTURE as Dataset, today });
      const perTe = screen.getByRole('link', { name: /Per te · Prodotto.*Su cosa formarti.*Agenti AI crescono più di tutte/ });
      expect(perTe).toHaveAttribute('href', '#competenze/agenti?ruolo=prodotto');
    });
    it('senza storage del browser: la porta di oggi', () => {
      ruolo.scegli('prodotto');
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
      try {
        render(Doors, { data: FIXTURE as Dataset, today });
        expect(screen.getByRole('link', { name: /^Per te Su cosa formarti Agenti AI crescono/ })).toHaveAttribute('href', '#competenze/agenti');
      } finally {
        vi.restoreAllMocks();
      }
    });
    it('scelto o tolto un ruolo con le porte a vista, la porta si aggiorna', async () => {
      render(Doors, { data: FIXTURE as Dataset, today });
      ruolo.scegli('prodotto');
      await tick();
      expect(screen.getByRole('link', { name: /Per te · Prodotto/ })).toHaveAttribute('href', '#competenze/agenti?ruolo=prodotto');
      ruolo.scegli(null);
      await tick();
      expect(screen.getByRole('link', { name: /^Per te Su cosa formarti Agenti AI crescono/ })).toHaveAttribute('href', '#competenze/agenti');
    });
  });
  describe('con un settore ricordato', () => {
    // dati dei settori usciti l'1 ottobre, negli ultimi 30 giorni
    const recenti = { ...FIXTURE, eurostat_settori: { ...FIXTURE.eurostat_settori, aggiornato_eurostat: '2026-10-01T11:00:00+0200' } } as Dataset;
    const italia = () => screen.getByRole('link', { name: /L'AI in Italia/ });
    beforeEach(() => settore.scegli(null));
    it('l’etichetta dice il settore e il link apre la card Business con il settore', () => {
      settore.scegli('manifattura');
      render(Doors, { data: recenti, today });
      expect(italia()).toHaveAccessibleName(/^Per la tua organizzazione · Manifattura L'AI in Italia 15% delle imprese manifatturiere italiane usa l'AI \(UE: 17%\)/);
      expect(italia()).toHaveAttribute('href', '#business?settore=manifattura');
    });
    it('scelto o tolto un settore con le porte a vista, la porta si aggiorna', async () => {
      render(Doors, { data: recenti, today });
      expect(italia()).toHaveAttribute('href', '#geopoliticai?area=ue');
      settore.scegli('ict');
      await tick();
      expect(italia()).toHaveAccessibleName(/^Per la tua organizzazione · Informazione e comunicazione /);
      settore.scegli(null);
      await tick();
      expect(italia()).toHaveAttribute('href', '#geopoliticai?area=ue');
    });
    it('senza storage del browser: la porta di oggi', () => {
      settore.scegli('manifattura');
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
      try {
        render(Doors, { data: recenti, today });
        expect(italia()).toHaveAttribute('href', '#geopoliticai?area=ue');
      } finally {
        vi.restoreAllMocks();
      }
    });
  });
});
