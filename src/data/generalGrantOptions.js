export const generalGrantOptions = [
  {
    id: 'eu-life-programme',
    title: 'LIFE Programme',
    shortType: 'EU-wide',
    officialPage: 'https://cinea.ec.europa.eu/programmes/life/life-support-applicants_en',
    applicationPage: 'https://cinea.ec.europa.eu/life-calls-proposals-2026_en',
    summary:
      'LIFE supports environment, climate, circular economy, clean energy, and sustainability projects with clear EU added value.',
    fitRules: {
      mainGoals: ['sustainabilityUpgrade', 'other'],
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
      'The EIC Accelerator supports startups and SMEs with high-risk, high-potential innovations that could scale strongly or disrupt a market.',
    fitRules: {
      mainGoals: ['digitize', 'expandOperations', 'hireStaff', 'other'],
      businessTypes: ['service', 'manufacturer', 'retail', 'foodProducer'],
      contextSignals: ['innovation', 'software', 'digital', 'platform', 'technology', 'scale', 'market'],
    },
  },
  {
    id: 'eu-horizon-europe',
    title: 'Horizon Europe',
    shortType: 'EU-wide',
    officialPage:
      'https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en',
    applicationPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/horizon-europe_en',
    summary:
      'Horizon Europe is the EU’s main research and innovation programme and is relevant for collaborative, experimental, or high-impact innovation projects.',
    fitRules: {
      mainGoals: ['digitize', 'sustainabilityUpgrade', 'expandOperations', 'other'],
      businessTypes: ['service', 'manufacturer', 'foodProducer', 'farm'],
      contextSignals: ['research', 'innovation', 'pilot', 'prototype', 'technology', 'climate', 'collaboration'],
    },
  },
  {
    id: 'eu-digital-europe',
    title: 'Digital Europe Programme',
    shortType: 'EU-wide',
    officialPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/digital-europe-programme_en',
    applicationPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/digital-europe-programme_en',
    summary:
      'Digital Europe funds AI, cybersecurity, advanced digital skills, and deployment of digital technologies across the economy.',
    fitRules: {
      mainGoals: ['digitize', 'hireStaff', 'other'],
      businessTypes: ['service', 'manufacturer', 'retail', 'foodProducer'],
      contextSignals: ['ai', 'cyber', 'digital', 'software', 'data', 'skills', 'cloud'],
    },
  },
  {
    id: 'eu-single-market-programme',
    title: 'Single Market Programme',
    shortType: 'EU-wide',
    officialPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/single-market-programme_en',
    applicationPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/single-market-programme/overview/support-businesses_en',
    summary:
      'The Single Market Programme supports SME competitiveness, market access, business modernisation, and entrepreneurship support actions.',
    fitRules: {
      mainGoals: ['expandOperations', 'digitize', 'hireStaff', 'other'],
      businessTypes: ['service', 'retail', 'manufacturer', 'foodProducer', 'agriTourism'],
      contextSignals: ['market', 'export', 'growth', 'competitiveness', 'entrepreneurship', 'tourism'],
    },
  },
  {
    id: 'eu-investeu',
    title: 'InvestEU',
    shortType: 'EU-wide',
    officialPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/investeu_en',
    applicationPage: 'https://single-market-economy.ec.europa.eu/access-finance/investeu_en',
    summary:
      'InvestEU helps unlock long-term finance for innovation, growth, sustainability, and strategic investment through financial instruments.',
    fitRules: {
      mainGoals: ['expandOperations', 'buyEquipment', 'sustainabilityUpgrade', 'other'],
      businessTypes: ['service', 'manufacturer', 'retail', 'foodProducer', 'farm'],
      contextSignals: ['investment', 'scale', 'finance', 'loan', 'growth', 'equipment'],
    },
  },
  {
    id: 'eu-connecting-europe-facility',
    title: 'Connecting Europe Facility',
    shortType: 'EU-wide',
    officialPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/connecting-europe-facility_en',
    applicationPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/connecting-europe-facility_en',
    summary:
      'CEF supports projects linked to digital, energy, and transport connectivity and cross-border infrastructure.',
    fitRules: {
      mainGoals: ['digitize', 'sustainabilityUpgrade', 'other'],
      businessTypes: ['service', 'manufacturer', 'retail'],
      contextSignals: ['connectivity', 'infrastructure', 'broadband', 'energy', 'digital services', 'transport'],
    },
  },
  {
    id: 'eu-creative-europe',
    title: 'Creative Europe',
    shortType: 'EU-wide',
    officialPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/creative-europe_en',
    applicationPage: 'https://commission.europa.eu/funding-tenders/find-funding/eu-funding-programmes/creative-europe_en',
    summary:
      'Creative Europe supports cultural, creative, and audiovisual projects, including cross-border collaboration and sector development.',
    fitRules: {
      mainGoals: ['expandOperations', 'digitize', 'other'],
      businessTypes: ['service', 'retail', 'agriTourism'],
      contextSignals: ['creative', 'design', 'culture', 'media', 'audiovisual', 'tourism'],
    },
  },
  {
    id: 'eu-innovation-fund',
    title: 'Innovation Fund',
    shortType: 'EU-wide',
    officialPage: 'https://cinea.ec.europa.eu/programmes/innovation-fund_en',
    applicationPage: 'https://cinea.ec.europa.eu/programmes/innovation-fund_en',
    summary:
      'The Innovation Fund supports innovative low-carbon technologies, clean industry, energy storage, hydrogen, and net-zero transition projects.',
    fitRules: {
      mainGoals: ['sustainabilityUpgrade', 'buyEquipment', 'other'],
      businessTypes: ['manufacturer', 'farm', 'foodProducer', 'service'],
      contextSignals: ['low-carbon', 'net zero', 'hydrogen', 'energy storage', 'clean technology', 'decarbonisation'],
    },
  },
  {
    id: 'eu-i3-instrument',
    title: 'Interregional Innovation Investments (I3)',
    shortType: 'EU-wide',
    officialPage: 'https://eismea.ec.europa.eu/programmes/interregional-innovation-investments_en',
    applicationPage: 'https://eismea.ec.europa.eu/programmes/interregional-innovation-investments_en',
    summary:
      'The I3 Instrument supports close-to-market interregional innovation projects, piloting, validation, and scale-up across EU regions.',
    fitRules: {
      mainGoals: ['digitize', 'expandOperations', 'sustainabilityUpgrade', 'other'],
      businessTypes: ['service', 'manufacturer', 'foodProducer'],
      contextSignals: ['pilot', 'validation', 'interregional', 'scale-up', 'smart manufacturing', 'innovation ecosystem'],
    },
  },
];
