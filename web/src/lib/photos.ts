import type { TileId } from './router';
import modelli from '../assets/photos/modelli.jpg?w=900&format=webp';
import modelliSet from '../assets/photos/modelli.jpg?w=480;900&format=webp&as=srcset';
import open from '../assets/photos/open.jpg?w=900&format=webp';
import openSet from '../assets/photos/open.jpg?w=480;900&format=webp&as=srcset';
import business from '../assets/photos/business.jpg?w=900&format=webp';
import businessSet from '../assets/photos/business.jpg?w=480;900&format=webp&as=srcset';
import persone from '../assets/photos/persone.jpg?w=900&format=webp';
import personeSet from '../assets/photos/persone.jpg?w=480;900&format=webp&as=srcset';
import politica from '../assets/photos/politica.jpg?w=900&format=webp';
import politicaSet from '../assets/photos/politica.jpg?w=480;900&format=webp&as=srcset';
import competenze from '../assets/photos/competenze.jpg?w=900&format=webp';
import competenzeSet from '../assets/photos/competenze.jpg?w=480;900&format=webp&as=srcset';
import notizie from '../assets/photos/notizie.jpg?w=900&format=webp';
import notizieSet from '../assets/photos/notizie.jpg?w=480;900&format=webp&as=srcset';
import rapporti from '../assets/photos/rapporti.jpg?w=900&format=webp';
import rapportiSet from '../assets/photos/rapporti.jpg?w=480;900&format=webp&as=srcset';

/** licenzaUrl: testo della licenza; vuoto per il pubblico dominio. */
export interface Photo { src: string; srcset: string; alt: string; titolo: string; autore: string; licenza: string; licenzaUrl: string; pagina: string }

const C = 'https://commons.wikimedia.org/wiki/File:';
const BY = 'https://creativecommons.org/licenses/by/4.0/';
const BY_SA = 'https://creativecommons.org/licenses/by-sa/4.0/';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';

export const PHOTOS: Record<TileId, Photo> = {
  modelli: { src: modelli, srcset: modelliSet, alt: 'Armadio di server in un data center',
    titolo: 'Rear of rack at NERSC data center - closeup', autore: 'Derrick Coetzee from Berkeley, CA, USA', licenza: 'CC0', licenzaUrl: CC0,
    pagina: `${C}Rear_of_rack_at_NERSC_data_center_-_closeup.jpg` },
  open: { src: open, srcset: openSet, alt: 'Due persone lavorano allo stesso portatile durante un hackathon',
    titolo: 'Wikimedia Hackathon 2025 - day 3 - 001', autore: 'Vera de Kok', licenza: 'CC BY-SA 4.0', licenzaUrl: BY_SA,
    pagina: `${C}Wikimedia_Hackathon_2025_-_day_3_-_001.jpg` },
  business: { src: business, srcset: businessSet, alt: 'Ricercatrice in camera bianca con un wafer di silicio',
    titolo: 'Silicon wafer researcher', autore: 'U.S. Department of Energy', licenza: 'Pubblico dominio', licenzaUrl: '',
    pagina: `${C}Silicon_wafer_researcher.jpg` },
  persone: { src: persone, srcset: personeSet, alt: 'Persona al lavoro in un ufficio open space',
    titolo: 'Working in open office space (Unsplash)', autore: 'Crew crew', licenza: 'CC0', licenzaUrl: CC0,
    pagina: `${C}Working_in_open_office_space_(Unsplash).jpg` },
  norme: { src: politica, srcset: politicaSet, alt: "L'emiciclo del Parlamento europeo a Strasburgo",
    titolo: 'Hemicycle of the European Parliament, Strasbourg 2023 003', autore: 'Sebastian Wallroth', licenza: 'CC BY 4.0', licenzaUrl: BY,
    pagina: `${C}Hemicycle_of_the_European_Parliament,_Strasbourg_2023_003.jpg` },
  competenze: { src: competenze, srcset: competenzeSet, alt: 'Studentessa che spiega il suo lavoro al portatile',
    titolo: 'Wiki Education at UC Berkeley April 2018 111', autore: 'Cassidy (Wiki Ed)', licenza: 'CC BY-SA 4.0', licenzaUrl: BY_SA,
    pagina: `${C}Wiki_Education_at_UC_Berkeley_April_2018_111.jpg` },
  notizie: { src: notizie, srcset: notizieSet, alt: 'Sala di spedizione dei giornali del New York World-Telegram, anni Quaranta',
    titolo: 'Interior view of newspaper delivery room (World-Telegram)', autore: 'Miscellaneous Items in High Demand, PPOC, Library of Congress', licenza: 'Pubblico dominio', licenzaUrl: '',
    pagina: `${C}Interior_view_of_newspaper_delivery_room_showing_man_taking_stack_of_newspapers_from_machine)_-_World-Telegram_photo_LCCN95506971.jpg` },
  rapporti: { src: rapporti, srcset: rapportiSet, alt: 'Sala di lettura della Library of Congress',
    titolo: 'LOC Main Reading Room Highsmith', autore: 'Carol M. Highsmith', licenza: 'Pubblico dominio', licenzaUrl: '',
    pagina: `${C}LOC_Main_Reading_Room_Highsmith.jpg` },
};
