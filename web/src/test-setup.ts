import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom non implementa il canvas: senza questo stub logga "Not implemented" a ogni test.
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
