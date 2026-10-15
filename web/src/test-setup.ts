import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach, vi } from 'vitest';

// senza `globals: true` Testing Library non registra da sola la pulizia del DOM.
afterEach(() => cleanup());

// jsdom non implementa il canvas: senza questo stub logga "Not implemented" a ogni test.
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// jsdom non implementa ResizeObserver, usato da bind:clientWidth di Svelte.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
