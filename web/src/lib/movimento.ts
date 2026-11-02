/** «Riduci movimento» è attivo. jsdom non ha matchMedia. */
export const riduciMovimento = (): boolean => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Come scorrere fino a un elemento: subito con «riduci movimento», altrimenti morbido. */
export const scorrimento = (): ScrollBehavior => (riduciMovimento() ? 'auto' : 'smooth');
