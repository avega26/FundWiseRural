export const generalGrantOptions = [
  {
    id: 'eu-life-programme',
    title: 'LIFE Programme',
    shortType: 'EU-wide',
    officialPage:
      'https://cinea.ec.europa.eu/programmes/life/life-support-applicants_en',
    applicationPage:
      'https://cinea.ec.europa.eu/life-calls-proposals-2026_en',
    summary:
      'LIFE is the EU programme for environment and climate action. It can support companies and organisations working on greener products, sustainability upgrades, climate action, circular economy, or clean energy transition projects.',
    fitRules: {
      mainGoals: ['sustainabilityUpgrade'],
      businessTypes: ['farm', 'foodProducer', 'manufacturer', 'service', 'agriTourism'],
      contextSignals: ['sustain', 'green', 'energy', 'water', 'irrigation', 'climate', 'circular'],
    },
  },
  {
    id: 'eu-eic-accelerator',
    title: 'EIC Accelerator',
    shortType: 'EU-wide',
    officialPage: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en',
    applicationPage: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator/eic-accelerator-open_en',
    summary:
      'The EIC Accelerator supports startups and SMEs with high-risk, high-potential innovations that could scale strongly or disrupt a market. It is most relevant for ambitious innovation-led businesses rather than standard local upgrades.',
    fitRules: {
      mainGoals: ['digitize', 'expandOperations', 'hireStaff', 'other'],
      businessTypes: ['service', 'manufacturer', 'retail', 'foodProducer'],
      contextSignals: ['innovation', 'software', 'digital', 'platform', 'technology', 'scale', 'market'],
    },
  },
];
