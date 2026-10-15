const IT: Record<string, string> = {
  World: 'Mondo', Italy: 'Italia', 'United States': 'USA', China: 'Cina', Germany: 'Germania', France: 'Francia',
  Spain: 'Spagna', 'United Kingdom': 'Regno Unito', Netherlands: 'Paesi Bassi', Poland: 'Polonia', Belgium: 'Belgio',
  Austria: 'Austria', Denmark: 'Danimarca', Finland: 'Finlandia', Sweden: 'Svezia', Norway: 'Norvegia', Ireland: 'Irlanda',
  Portugal: 'Portogallo', Greece: 'Grecia', Czechia: 'Cechia', Slovakia: 'Slovacchia', Slovenia: 'Slovenia', Croatia: 'Croazia',
  Hungary: 'Ungheria', Romania: 'Romania', Bulgaria: 'Bulgaria', Estonia: 'Estonia', Latvia: 'Lettonia', Lithuania: 'Lituania',
  Luxembourg: 'Lussemburgo', Malta: 'Malta', Cyprus: 'Cipro', Iceland: 'Islanda', Switzerland: 'Svizzera', Turkey: 'Turchia',
  Serbia: 'Serbia', Montenegro: 'Montenegro', Albania: 'Albania', 'North Macedonia': 'Macedonia del Nord',
  'Bosnia and Herzegovina': 'Bosnia ed Erzegovina', Canada: 'Canada', Australia: 'Australia', 'New Zealand': 'Nuova Zelanda',
  Japan: 'Giappone', 'South Korea': 'Corea del Sud', India: 'India', Brazil: 'Brasile', Mexico: 'Messico', Chile: 'Cile',
  'Hong Kong': 'Hong Kong', Singapore: 'Singapore', 'United Arab Emirates': 'Emirati Arabi Uniti', 'European Union (27)': 'Unione europea',
};
export const paese = (en: string): string => IT[en] ?? en;
