import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../data/types';
import { ricorda } from '../ruolo.svelte';
import { FIXTURE, FIXTURE_TODAY as today } from '../test/fixtures';
import Doors from './Doors.svelte';

describe('Doors', () => {
  it('due porte come link alla card della notizia', () => {
    render(Doors, { data: FIXTURE as Dataset, today });
    const perTe = screen.getByRole('link', { name: /Per te.*Su cosa formarti.*MCP entra tra le competenze da imparare ora/ });
    expect(perTe).toHaveAttribute('href', '#competenze/mcp');
    expect(perTe.querySelector('em')).toHaveTextContent('MCP');
    const italia = screen.getByRole('link', { name: /Per la tua organizzazione.*L'AI in Italia.*A ottobre esce State of AI Report/ });
    expect(italia).toHaveAttribute('href', '#rapporti/state-of-ai-report');
    expect(screen.getByText('Radar delle competenze · dati al 15 ott 2026')).toBeInTheDocument();
  });
  it('senza dati: porte non cliccabili che lo dicono', () => {
    render(Doors, { data: {}, today });
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getAllByText('Dati non ancora disponibili')).toHaveLength(2);
    expect(screen.getByText('Su cosa formarti')).toBeInTheDocument();
  });

  describe('con un ruolo ricordato', () => {
    beforeEach(() => ricorda(null));
    it('l’etichetta dice il ruolo e il link apre la card con il ruolo', () => {
      ricorda('prodotto');
      render(Doors, { data: FIXTURE as Dataset, today });
      const perTe = screen.getByRole('link', { name: /Per te · Prodotto.*Su cosa formarti.*RAG esce da Impara ora/ });
      expect(perTe).toHaveAttribute('href', '#competenze/rag?ruolo=prodotto');
    });
    it('senza storage del browser: la porta di oggi', () => {
      ricorda('prodotto');
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
      try {
        render(Doors, { data: FIXTURE as Dataset, today });
        expect(screen.getByRole('link', { name: /^Per te Su cosa formarti MCP entra/ })).toHaveAttribute('href', '#competenze/mcp');
      } finally {
        vi.restoreAllMocks();
      }
    });
    it('scelto o tolto un ruolo con le porte a vista, la porta si aggiorna', async () => {
      render(Doors, { data: FIXTURE as Dataset, today });
      ricorda('prodotto');
      await tick();
      expect(screen.getByRole('link', { name: /Per te · Prodotto/ })).toHaveAttribute('href', '#competenze/rag?ruolo=prodotto');
      ricorda(null);
      await tick();
      expect(screen.getByRole('link', { name: /Per te.*MCP entra/ })).toHaveAttribute('href', '#competenze/mcp');
    });
  });
});
