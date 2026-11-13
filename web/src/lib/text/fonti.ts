/** Le fonti dei dati del colophon, nell'ordine in cui si leggono: un elenco solo per l'app e per la home in chiaro. */
export const FONTI_DEI_DATI: readonly { nome: string; url: string }[] = [
  { nome: 'Epoch AI', url: 'https://epoch.ai/data/ai-models' }, { nome: 'arXiv', url: 'https://arxiv.org' },
  { nome: 'GitHub', url: 'https://github.com' }, { nome: 'Hugging Face', url: 'https://huggingface.co' }, { nome: 'The Adzuna API', url: 'https://www.adzuna.co.uk' },
  { nome: 'Eurostat', url: 'https://ec.europa.eu/eurostat' }, { nome: 'Our World in Data', url: 'https://ourworldindata.org' },
];

/** I nomi delle fonti di status.json, per chi legge. */
export const NOMI_FONTI: Record<string, string> = {
  epoch: 'Epoch AI', geopoliticai: 'Epoch (GeopoliticAI)', arxiv: 'arXiv', github: 'GitHub', huggingface: 'Hugging Face',
  adzuna: 'Adzuna', eurostat: 'Eurostat', eurostat_settori: 'Eurostat (settori)', owid: 'Our World in Data', ai_act: 'AI Act (a mano)', rapporti: 'Rapporti (a mano)', catena: "Catena dell'AI (dati curati)",
  feeds: 'Feed delle notizie', risorse: 'Link delle risorse', radar: 'Radar (calcolo)', news: 'Notizie', status: 'Stato delle fonti',
};
