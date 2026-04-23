export const fundingPrograms = [
  {
    id: 'cap-rural-development-grant',
    name: 'CAP Rural Development Grant',
    fundType: 'CAP',
    description:
      'Supports rural businesses investing in resilience, farm development, and local economic activity.',
    supportedBusinessTypes: ['farm', 'agriTourism', 'foodProducer'],
    supportedGoals: ['expandOperations', 'buyEquipment', 'hireStaff'],
    ruralRequired: true,
    supportedSizes: ['micro', 'small', 'medium'],
    externalLink:
      'https://agriculture.ec.europa.eu/common-agricultural-policy/financing-cap/cap-funds_en',
    eligibilityHint:
      'Most suitable for rural businesses with clear links to agricultural or local rural development activity.',
  },
  {
    id: 'cap-green-transition-support',
    name: 'CAP Green Transition Support',
    fundType: 'CAP',
    description:
      'Helps rural enterprises invest in greener operations, resource efficiency, and sustainable upgrades.',
    supportedBusinessTypes: ['farm', 'agriTourism', 'foodProducer'],
    supportedGoals: ['sustainabilityUpgrade', 'buyEquipment', 'digitize'],
    ruralRequired: true,
    supportedSizes: ['micro', 'small', 'medium'],
    externalLink:
      'https://agriculture.ec.europa.eu/common-agricultural-policy/rural-development_en',
    eligibilityHint:
      'Best fit for rural applicants planning sustainability improvements or greener production methods.',
  },
  {
    id: 'erdf-sme-digitalisation-grant',
    name: 'ERDF SME Digitalisation Grant',
    fundType: 'ERDF',
    description:
      'Supports SMEs adopting digital tools, business systems, and process improvements to boost competitiveness.',
    supportedBusinessTypes: ['manufacturer', 'retail', 'service', 'foodProducer'],
    supportedGoals: ['digitize', 'expandOperations'],
    ruralRequired: false,
    supportedSizes: ['micro', 'small', 'medium'],
    externalLink:
      'https://ec.europa.eu/regional_policy/funding/erdf_en',
    eligibilityHint:
      'Typically a strong option for SMEs seeking digital transformation or operational modernisation.',
  },
  {
    id: 'erdf-regional-growth-fund',
    name: 'ERDF Regional Growth Fund',
    fundType: 'ERDF',
    description:
      'Designed to help regional businesses scale, create jobs, and strengthen local economic growth.',
    supportedBusinessTypes: ['manufacturer', 'retail', 'service', 'agriTourism'],
    supportedGoals: ['expandOperations', 'hireStaff', 'buyEquipment'],
    ruralRequired: false,
    supportedSizes: ['small', 'medium'],
    externalLink:
      'https://ec.europa.eu/regional_policy/in-your-country/managing-authorities_en',
    eligibilityHint:
      'Often relevant for growth-focused businesses planning expansion, recruitment, or capital investment.',
  },
];
