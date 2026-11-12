// Il modulo Edizioni: tre operazioni pure, che non toccano file, orologio o rete.
export { creaEdizione } from './crea';
export { fileDelleEdizioni, type OpzioniFileDelleEdizioni } from './fileDelleEdizioni';
export { IMMAGINE } from './pagine';
export type { Destinazione, Edizione } from './tipi';

/**
 * Se un giro deve creare l'edizione: il programmato sì, l'avvio manuale solo con la casella accesa, il push mai.
 * Mai se il file esiste già: un'edizione non si sovrascrive.
 */
export function deveCreare({ evento, casella, esiste }: { evento: string; casella: boolean; esiste: boolean }): boolean {
  if (esiste) return false;
  return evento === 'schedule' || (evento === 'workflow_dispatch' && casella);
}
