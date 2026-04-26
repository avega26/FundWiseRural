import { programmeData } from '../data/programmeData';
import { defaultLanguage, getTranslation, regionsByCountry } from '../i18n/translations';

const HOSTED_AI_ENDPOINT = '/api/recommendations';
const HOSTED_ASSISTANT_ENDPOINT = '/api/assistant';
const COUNTRY_ROUTE_NAMES = {
  spain: 'Spain',
  italy: 'Italy',
  poland: 'Poland',
  france: 'France',
};

const CAP_SIGNALS = [
  'farm',
  'crops',
  'irrigation',
  'land',
  'greenhouse',
  'harvest',
  'agricultural',
  'production',
  'sustainability',
  'rural production',
  'flowers',
];

const ERDF_SIGNALS = [
  'website',
  'ecommerce',
  'digital tools',
  'booking',
  'software',
  'innovation',
  'retail',
  'competitiveness',
  'expansion',
  'modernization',
  'online sales',
];

const SERVICE_SIGNALS = [
  'design',
  'studio',
  'events',
  'floral design',
  'consulting',
  'hospitality',
  'tourism',
  'urban clients',
];

const FIT_WEIGHTS = {
  businessType: 22,
  projectGoal: 22,
  rural: 18,
  size: 10,
  context: 13,
  routeFit: 15,
};

export function analyzeProfileReview(profile) {
  const language = profile.preferredLanguage || defaultLanguage;
  const copy = getTranslation(language);
  const context = `${profile.additionalContext || ''} ${profile.otherMainGoal || ''}`.toLowerCase();

  let capHits = countSignals(context, CAP_SIGNALS);
  const erdfHits = countSignals(context, ERDF_SIGNALS);
  const serviceHits = countSignals(context, SERVICE_SIGNALS);

  if (
    ['flowersHorticulture', 'fieldCrops', 'greenhouse', 'irrigationWater', 'mixedAgriculture'].includes(
      profile.agricultureSubType,
    )
  ) {
    capHits += 1;
  }

  const farmType = profile.businessType === 'farm';
  const serviceType = ['service', 'retail', 'agriTourism'].includes(profile.businessType);
  const capGoal = ['buyEquipment', 'sustainabilityUpgrade'].includes(profile.mainGoal);
  const erdfGoal = ['digitize', 'expandOperations', 'hireStaff'].includes(profile.mainGoal);

  let confidence = 'medium';
  let consistency = 'mixed';
  let explanation = '';
  let note = '';
  let routeClassification = 'mixed';

  const structuredCap = (farmType ? 2 : 0) + (profile.ruralArea === 'yes' ? 1 : 0) + (capGoal ? 1 : 0);
  const structuredErdf = (serviceType ? 1 : 0) + (erdfGoal ? 1 : 0) + (profile.businessSize ? 1 : 0);

  if (farmType && serviceHits >= 2 && capHits === 0) {
    confidence = 'low';
    consistency = 'conflicting';
    routeClassification = 'mixed';
    explanation = buildProfileReviewExplanation(language, 'farmServiceConflict', {
      businessType: copy.businessTypes[profile.businessType] || '',
      mainGoal: copy.goals[profile.mainGoal] || '',
    });
    note = buildAmbiguityNote(language);
  } else if (farmType && capHits > 0 && erdfHits > 0) {
    confidence = 'medium';
    consistency = 'mixed';
    routeClassification = 'mixed';
    explanation = buildProfileReviewExplanation(language, 'farmMixed', {
      businessType: copy.businessTypes[profile.businessType] || '',
      mainGoal: copy.goals[profile.mainGoal] || '',
    });
  } else if (structuredCap >= 3 && capHits > erdfHits && serviceHits === 0) {
    confidence = 'high';
    consistency = 'consistent';
    routeClassification = 'cap';
    explanation = buildProfileReviewExplanation(language, 'capAligned', {
      businessType: copy.businessTypes[profile.businessType] || '',
      mainGoal: copy.goals[profile.mainGoal] || '',
    });
  } else if (structuredErdf >= 2 && erdfHits >= capHits) {
    confidence = erdfHits > 0 ? 'high' : 'medium';
    consistency = erdfHits > 0 ? 'consistent' : 'mixed';
    routeClassification = 'erdf';
    explanation = buildProfileReviewExplanation(language, 'erdfAligned', {
      businessType: copy.businessTypes[profile.businessType] || '',
      mainGoal: copy.goals[profile.mainGoal] || '',
    });
  } else if (capHits === 0 && erdfHits === 0 && serviceHits === 0) {
    confidence = 'medium';
    consistency = 'mixed';
    routeClassification = structuredCap > structuredErdf ? 'cap' : structuredErdf > structuredCap ? 'erdf' : 'mixed';
    explanation = buildProfileReviewExplanation(language, 'limitedContext', {
      businessType: copy.businessTypes[profile.businessType] || '',
      mainGoal: copy.goals[profile.mainGoal] || '',
    });
  } else {
    confidence = 'medium';
    consistency = 'mixed';
    routeClassification = capHits > erdfHits ? 'cap' : erdfHits > capHits ? 'erdf' : 'mixed';
    explanation = buildProfileReviewExplanation(language, 'mixedGeneral', {
      businessType: copy.businessTypes[profile.businessType] || '',
      mainGoal: copy.goals[profile.mainGoal] || '',
    });
  }

  return {
    confidence,
    consistency,
    explanation,
    note,
    routeClassification,
    rankingReason: buildRankingReason(language, routeClassification, consistency),
    detectedSignals: buildDetectedSignals(language, {
      capHits,
      erdfHits,
      serviceHits,
    }),
    executiveSummary: '',
    signals: {
      capHits,
      erdfHits,
      serviceHits,
    },
  };
}

export async function generateAIRecommendations(profile, matchedPrograms) {
  const localReview = analyzeProfileReview(profile);
  const localRecommendations = harmonizeRecommendationSet(generateMockAIRecommendations(
    profile,
    matchedPrograms,
    localReview,
  ), localReview, profile);
  const finalizedLocalRecommendations = finalizeRecommendations(localRecommendations, localReview, profile);
  localReview.executiveSummary = buildExecutiveSummary(
    profile,
    finalizedLocalRecommendations,
    localReview,
  );

  try {
    const hostedResult = await generateHostedRecommendations(
      profile,
      localRecommendations,
    );
    const mergedRecommendations = finalizeRecommendations(
      harmonizeRecommendationSet(
        mergeRecommendations(localRecommendations, hostedResult.recommendations),
        localReview,
        profile,
      ),
      localReview,
      profile,
    );
    const normalizedReview = normalizeProfileReview(localReview, hostedResult.profileReview);
    normalizedReview.executiveSummary =
      normalizedReview.executiveSummary ||
      buildExecutiveSummary(profile, mergedRecommendations, normalizedReview);

    return {
      profileReview: normalizedReview,
      recommendations: mergedRecommendations,
      source: 'cloudflare-ai',
    };
  } catch (error) {
    console.warn('Hosted AI unavailable, using local recommendation fallback.', error);

    return {
      profileReview: localReview,
      recommendations: finalizedLocalRecommendations,
      source: 'local-fallback',
    };
  }
}

export async function askFundwiseAssistant({
  question,
  language = defaultLanguage,
  submittedProfile = null,
  profileReview = null,
  results = [],
  currentScreen = 'form',
}) {
  const localAnswer = buildLocalAssistantResponse({
    question,
    language,
    submittedProfile,
    profileReview,
    results,
    currentScreen,
  });

  try {
    const hostedResult = await generateHostedAssistantResponse({
      question,
      language,
      submittedProfile,
      profileReview,
      results,
      currentScreen,
    });

    return {
      answer: sanitizeAssistantAnswer(hostedResult?.answer, localAnswer),
      source: 'cloudflare-ai',
    };
  } catch (error) {
    console.warn('Assistant AI unavailable, using local assistant fallback.', error);
    return {
      answer: localAnswer,
      source: 'local-fallback',
    };
  }
}

export function generateMockAIRecommendations(profile, matchedPrograms, profileReview) {
  const language = profile.preferredLanguage || defaultLanguage;
  const copy = getTranslation(language);
  const businessName = profile.businessName?.trim();
  const countryLabel = COUNTRY_ROUTE_NAMES[profile.country] || '';
  const countryDisplayLabel = copy.countries[profile.country] || '';
  const regionLabel =
    regionsByCountry[profile.country]?.find((region) => region.value === profile.region)?.label ||
    '';
  const businessTypeLabel = copy.businessTypes[profile.businessType] || '';
  const agricultureSubTypeLabel =
    copy.agricultureSubTypes?.[profile.agricultureSubType] || '';
  const detailedBusinessTypeLabel = agricultureSubTypeLabel
    ? `${businessTypeLabel} (${agricultureSubTypeLabel})`
    : businessTypeLabel;
  const businessSizeLabel = getNarrativeBusinessSize(profile.businessSize, language);
  const goalLabel =
    profile.mainGoal === 'other'
      ? profile.otherMainGoal?.trim() || copy.goals.other || ''
      : copy.goals[profile.mainGoal] || profile.otherMainGoal?.trim() || '';
  const tagLabels = profile.specialTags.map((tag) => copy.tags[tag]).filter(Boolean);
  const review = profileReview || analyzeProfileReview(profile);

  return matchedPrograms
    .map((program) => {
      const isCAP = program.fundType === 'CAP';
      const route = selectProgrammeRoute(program.fundType, countryLabel, regionLabel);
      const fitBreakdown = buildFitBreakdown(program, profile, review, route);
      const fitScore = normalizeFitScore(fitBreakdown);
      const aiAdjustedScore = adjustScoreForAmbiguity(fitScore, profile, review);
      const displayName = buildRecommendationTitle(program, route, language);

      return {
        ...program,
        name: displayName,
        program_name: program.name,
        explanation: buildExplanation({
          language,
          businessName,
          businessTypeLabel: detailedBusinessTypeLabel,
          businessSizeLabel,
          goalLabel,
          tagLabels,
          review,
          isCAP,
          route,
        }),
        eligibility: determineEligibility(aiAdjustedScore),
        requirements: buildRequirements(language, isCAP ? 'cap' : 'erdf'),
        nextStep: buildNextStep(language, isCAP, review, route),
        draftSupport: null,
        routeDetails: {
          programme: route?.programmeTitle || program.name,
          country: route?.country || countryDisplayLabel || 'EU',
          region: route?.region || regionLabel || 'Regional route',
          authority: route?.authority || 'Relevant managing authority',
        },
        routeContext: {
          targetApplicants: route?.targetApplicants || '',
          commonPriorities: route?.commonPriorities || [],
          commonConstraints: route?.commonConstraints || [],
          regionNotes: route?.regionNotes || [],
        },
        routeSummary: route?.summary || program.summary || program.description || '',
        applicationPage: route?.applicationPage || program.externalLink,
        officialPage: route?.officialPage || program.externalLink,
        supportsMockApplication: Boolean(route?.supportsMockApplication),
        applicationRouteType: route?.applicationRouteType || 'official-entry',
        authority: route?.authority || 'Relevant managing authority',
        estimatedTimeline: buildEstimatedTimeline(language, program, route),
        aiAdjustedScore,
        rankingScore: aiAdjustedScore,
        fitScore,
        fitBreakdown,
        rankingReason: buildProgrammeRankingReason(language, isCAP, review, route),
      };
    })
    .sort((left, right) => compareRecommendations(left, right, review, profile));
}

export function generateDraftApplicationSupport(profile, recommendation, profileReview) {
  const language = profile?.preferredLanguage || defaultLanguage;
  const copy = getTranslation(language);
  const countryLabel = COUNTRY_ROUTE_NAMES[profile?.country] || '';
  const regionLabel =
    regionsByCountry[profile?.country]?.find((region) => region.value === profile?.region)?.label ||
    '';
  const route = {
    programmeTitle: recommendation?.routeDetails?.programme,
    country: recommendation?.routeDetails?.country || countryLabel,
    region: recommendation?.routeDetails?.region || regionLabel,
    authority: recommendation?.routeDetails?.authority,
    targetApplicants: recommendation?.routeContext?.targetApplicants || '',
    commonPriorities: recommendation?.routeContext?.commonPriorities || [],
    commonConstraints: recommendation?.routeContext?.commonConstraints || [],
    regionNotes: recommendation?.routeContext?.regionNotes || [],
    applicationPage: recommendation?.applicationPage,
    officialPage: recommendation?.officialPage,
  };
  const businessTypeLabel = copy.businessTypes[profile?.businessType] || '';
  const agricultureSubTypeLabel = copy.agricultureSubTypes?.[profile?.agricultureSubType] || '';
  const detailedBusinessTypeLabel = agricultureSubTypeLabel
    ? `${businessTypeLabel} (${agricultureSubTypeLabel})`
    : businessTypeLabel;
  const businessSizeLabel = getNarrativeBusinessSize(profile?.businessSize, language);
  const goalLabel =
    profile?.mainGoal === 'other'
      ? profile?.otherMainGoal?.trim() || copy.goals.other || ''
      : copy.goals[profile?.mainGoal] || profile?.otherMainGoal?.trim() || '';
  const tagLabels = (profile?.specialTags || []).map((tag) => copy.tags[tag]).filter(Boolean);

  return buildDraftSupport({
    program: recommendation,
    language,
    businessName: profile?.businessName?.trim(),
    businessTypeLabel: detailedBusinessTypeLabel,
    businessSizeLabel,
    goalLabel,
    tagLabels,
    review: profileReview || analyzeProfileReview(profile || {}),
    isCAP: recommendation?.fundType === 'CAP',
    route,
  });
}

function finalizeRecommendations(recommendations, review = { routeClassification: 'mixed' }, profile = {}) {
  const sorted = [...recommendations].sort((left, right) =>
    compareRecommendations(left, right, review, profile),
  );
  const meaningful = sorted.filter(
    (item) => item.eligibility !== 'unlikely' || item.rankingScore >= 48 || item.fitScore >= 45,
  );

  return (meaningful.length > 0 ? meaningful : sorted).slice(0, 3);
}

function harmonizeRecommendationSet(recommendations, review, profile = {}) {
  const sorted = [...recommendations].sort((left, right) =>
    compareRecommendations(left, right, review, profile),
  );

  return sorted.map((item, index) => {
    const expectedEligibility = getExpectedEligibility(item, review, index);
    const normalizedEligibility =
      item.eligibility === 'unlikely' && expectedEligibility !== 'unlikely'
        ? expectedEligibility
        : item.eligibility === 'likely' &&
            expectedEligibility === 'possible' &&
            item.fitScore < 55 &&
            item.rankingScore < 7
          ? 'possible'
          : item.eligibility || expectedEligibility;

    const explanation =
      normalizedEligibility === 'unlikely'
        ? ensureUnlikelyExplanation(item.explanation, item, review)
        : item.explanation;

    return {
      ...item,
      eligibility: normalizedEligibility,
      explanation,
    };
  });
}

function compareRecommendations(left, right, review, profile) {
  const scoreDelta = right.rankingScore - left.rankingScore;

  if (left.fundType !== right.fundType) {
    const capAnchoredProfile =
      profile.businessType === 'farm' &&
      profile.ruralArea === 'yes' &&
      ['buyEquipment', 'sustainabilityUpgrade'].includes(profile.mainGoal);

    const capPreferred =
      review.routeClassification === 'cap' ||
      (review.routeClassification === 'mixed' && capAnchoredProfile);

    const erdfPreferred = review.routeClassification === 'erdf';

    if (capPreferred && Math.abs(scoreDelta) < 14) {
      return left.fundType === 'CAP' ? -1 : 1;
    }

    if (erdfPreferred && Math.abs(scoreDelta) < 14) {
      return left.fundType === 'ERDF' ? -1 : 1;
    }

    if (review.routeClassification === 'mixed' && Math.abs(scoreDelta) < 8) {
      return left.fundType === 'CAP' ? -1 : 1;
    }
  }

  if (scoreDelta !== 0) {
    return scoreDelta;
  }

  return right.fitScore - left.fitScore;
}

function getExpectedEligibility(item, review, index) {
  const routeAligned =
    (review.routeClassification === 'cap' && item.fundType === 'CAP') ||
    (review.routeClassification === 'erdf' && item.fundType === 'ERDF') ||
    review.routeClassification === 'mixed';
  const strongFit = item.fitScore >= 72 || item.rankingScore >= 72;
  const mediumFit = item.fitScore >= 50 || item.rankingScore >= 50;

  if (strongFit && routeAligned) {
    return 'likely';
  }

  if (strongFit || (mediumFit && index === 0 && routeAligned)) {
    return 'possible';
  }

  if (mediumFit) {
    return 'possible';
  }

  return 'unlikely';
}

function ensureUnlikelyExplanation(explanation, item, review) {
  if (!explanation) {
    return buildUnlikelyReason(item, review);
  }

  const lower = explanation.toLowerCase();

  if (
    lower.includes('unlikely') ||
    lower.includes('less aligned') ||
    lower.includes('weaker fit') ||
    lower.includes('not the strongest route') ||
    lower.includes('less direct')
  ) {
    return explanation;
  }

  return `${explanation} ${buildUnlikelyReason(item, review)}`.trim();
}

function buildUnlikelyReason(item, review) {
  const issues = [];

  if (item.fitBreakdown.businessType <= 1) {
    issues.push('the business type is not a strong match');
  }

  if (item.fitBreakdown.projectGoal <= 1) {
    issues.push('the stated project goal lines up better with another route');
  }

  if (item.fitBreakdown.rural === 0) {
    issues.push('the rural or territorial fit is weak for this programme');
  }

  if (item.fitBreakdown.context <= 1 && review.consistency !== 'consistent') {
    issues.push('the written context introduces mixed signals');
  }

  if (item.routeContext?.commonConstraints?.length) {
    issues.push(
      `the route still requires verification against constraints such as ${item.routeContext.commonConstraints[0].toLowerCase()}`,
    );
  }

  if (issues.length === 0) {
    issues.push('the route is currently weaker than the higher-ranked alternatives');
  }

  return `At the moment, this route is less direct because ${issues.slice(0, 2).join(' and ')}.`;
}

function adjustScoreForAmbiguity(baseScore, profile, review) {
  let score = baseScore;
  const farmAnchoredCapCase =
    profile.businessType === 'farm' &&
    profile.ruralArea === 'yes' &&
    ['buyEquipment', 'sustainabilityUpgrade'].includes(profile.mainGoal);

  if (profile.businessType === 'farm' && review.signals.serviceHits >= 2 && review.signals.capHits === 0) {
    score -= 12;
  }

  if (review.signals.capHits > 0 && review.signals.erdfHits > 0) {
    score += 4;
  }

  if (farmAnchoredCapCase) {
    if (review.signals.capHits >= review.signals.erdfHits) {
      score += 8;
    } else {
      score += 4;
    }
  }

  if (review.consistency === 'consistent') {
    score += 4;
  }

  if (review.consistency === 'conflicting') {
    score -= 6;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function determineEligibility(score) {
  if (score >= 74) return 'likely';
  if (score >= 48) return 'possible';
  return 'unlikely';
}

function buildRecommendationTitle(program, route, language) {
  if (!route?.programmeTitle) {
    return program.name;
  }

  const pathwayLabels = {
    en: {
      'cap-rural-development-grant': 'rural investment pathway',
      'cap-green-transition-support': 'green transition pathway',
      'erdf-sme-digitalisation-grant': 'SME digitalisation pathway',
      'erdf-regional-growth-fund': 'regional growth pathway',
    },
    es: {
      'cap-rural-development-grant': 'vía de inversión rural',
      'cap-green-transition-support': 'vía de transición verde',
      'erdf-sme-digitalisation-grant': 'vía de digitalización pyme',
      'erdf-regional-growth-fund': 'vía de crecimiento regional',
    },
    it: {
      'cap-rural-development-grant': 'percorso di investimento rurale',
      'cap-green-transition-support': 'percorso di transizione verde',
      'erdf-sme-digitalisation-grant': 'percorso di digitalizzazione PMI',
      'erdf-regional-growth-fund': 'percorso di crescita regionale',
    },
    pl: {
      'cap-rural-development-grant': 'ścieżka inwestycji wiejskich',
      'cap-green-transition-support': 'ścieżka zielonej transformacji',
      'erdf-sme-digitalisation-grant': 'ścieżka cyfryzacji MŚP',
      'erdf-regional-growth-fund': 'ścieżka wzrostu regionalnego',
    },
    fr: {
      'cap-rural-development-grant': 'parcours d’investissement rural',
      'cap-green-transition-support': 'parcours de transition verte',
      'erdf-sme-digitalisation-grant': 'parcours de numérisation PME',
      'erdf-regional-growth-fund': 'parcours de croissance régionale',
    },
  };

  const pathway =
    pathwayLabels[language]?.[program.id] ||
    pathwayLabels.en[program.id];

  return pathway ? `${route.programmeTitle} - ${pathway}` : route.programmeTitle;
}

function getNarrativeBusinessSize(size, language) {
  const labels = {
    en: {
      micro: 'micro',
      small: 'small',
      medium: 'medium-sized',
      midCap: 'mid-cap',
      large: 'large',
    },
    es: {
      micro: 'micro',
      small: 'pequeña',
      medium: 'mediana',
      midCap: 'mid-cap',
      large: 'grande',
    },
    it: {
      micro: 'micro',
      small: 'piccola',
      medium: 'media',
      midCap: 'mid-cap',
      large: 'grande',
    },
    pl: {
      micro: 'mikro',
      small: 'mała',
      medium: 'średnia',
      midCap: 'mid-cap',
      large: 'duża',
    },
    fr: {
      micro: 'micro',
      small: 'petite',
      medium: 'moyenne',
      midCap: 'mid-cap',
      large: 'grande',
    },
  };

  return labels[language]?.[size] || labels.en[size] || 'small';
}

function normalizeFitScore(breakdown) {
  const weightedScore =
    (breakdown.businessType / 4) * FIT_WEIGHTS.businessType +
    (breakdown.projectGoal / 4) * FIT_WEIGHTS.projectGoal +
    (breakdown.rural / 3) * FIT_WEIGHTS.rural +
    (breakdown.size / 2) * FIT_WEIGHTS.size +
    (breakdown.context / 3) * FIT_WEIGHTS.context +
    (breakdown.routeFit / 3) * FIT_WEIGHTS.routeFit;

  return Math.max(0, Math.min(100, Math.round(weightedScore)));
}

function buildFitBreakdown(program, profile, review, route) {
  let businessType = 0;
  let projectGoal = 0;
  let rural = 0;
  let size = 0;
  let context = 0;
  let routeFit = 0;
  const otherGoalText = (profile.otherMainGoal || '').toLowerCase();

  if (program.supportedBusinessTypes?.includes(profile.businessType)) {
    businessType = 4;
  } else if (
    program.fundType === 'CAP' &&
    ['farm', 'agriTourism', 'foodProducer'].includes(profile.businessType)
  ) {
    businessType = 2;
  } else if (
    program.fundType === 'ERDF' &&
    ['service', 'retail', 'manufacturer'].includes(profile.businessType)
  ) {
    businessType = 2;
  }

  if (program.supportedGoals?.includes(profile.mainGoal)) {
    projectGoal = 4;
  } else if (
    program.fundType === 'CAP' &&
    ['buyEquipment', 'sustainabilityUpgrade'].includes(profile.mainGoal)
  ) {
    projectGoal = 2;
  } else if (
    program.fundType === 'ERDF' &&
    ['digitize', 'expandOperations', 'hireStaff'].includes(profile.mainGoal)
  ) {
    projectGoal = 2;
  } else if (profile.mainGoal === 'other') {
    if (
      program.fundType === 'CAP' &&
      /sustain|irrigat|equipment|land|farm|green|water|crop/.test(otherGoalText)
    ) {
      projectGoal = 2;
    } else if (
      program.fundType === 'ERDF' &&
      /digit|website|software|booking|ecommerce|expand|growth|staff|innovation/.test(
        otherGoalText,
      )
    ) {
      projectGoal = 2;
    }
  }

  if (program.ruralRequired) {
    rural = profile.ruralArea === 'yes' ? 3 : 0;
  } else {
    rural = profile.ruralArea === 'yes' && program.fundType === 'ERDF' ? 0 : 2;
  }

  if (program.supportedSizes?.includes(profile.businessSize)) {
    size = 2;
  } else if (profile.businessSize) {
    size = 1;
  }

  if (program.fundType === 'CAP') {
    context += Math.min(review.signals.capHits, 2);
    if (review.signals.serviceHits >= 2 && review.signals.capHits === 0) {
      context = Math.max(0, context - 1);
    }
    if (
      profile.businessType === 'farm' &&
      profile.ruralArea === 'yes' &&
      ['buyEquipment', 'sustainabilityUpgrade'].includes(profile.mainGoal)
    ) {
      context += 1;
    }
  } else {
    context += Math.min(review.signals.erdfHits, 2);
    if (review.signals.serviceHits > 0) {
      context += 1;
    }
    if (
      profile.businessType === 'farm' &&
      profile.ruralArea === 'yes' &&
      ['buyEquipment', 'sustainabilityUpgrade'].includes(profile.mainGoal)
    ) {
      context = Math.max(0, context - 1);
    }
  }

  if (route) {
    routeFit = 3;
  } else {
    routeFit = 0;
  }

  const total = businessType + projectGoal + rural + size + context + routeFit;

  return {
    businessType,
    projectGoal,
    rural,
    size,
    context,
    routeFit,
    total,
  };
}

function buildExplanation({
  language,
  businessName,
  businessTypeLabel,
  businessSizeLabel,
  goalLabel,
  tagLabels,
  review,
  isCAP,
  route,
}) {
  const subject = businessName || genericBusinessReference(language);
  const routeTitle = route?.programmeTitle || 'the relevant programme route';
  const location = [route?.region, route?.country].filter(Boolean).join(', ');
  const note = route?.regionNotes?.[0] || 'regional implementation can change access pathways';
  const tagText = tagLabels.slice(0, 2).join(', ');
  const mixedSignals = review.signals.capHits > 0 && review.signals.erdfHits > 0;

  if (language === 'en') {
    if (isCAP) {
      let text = `For ${subject}, this recommendation is tied to ${routeTitle}, implemented with regional specificities in ${location}. A ${businessSizeLabel.toLowerCase()} ${businessTypeLabel.toLowerCase()} business aiming to ${goalLabel.toLowerCase()} is more naturally aligned here than under ERDF because CAP is structured around agricultural investment, sustainability, and rural development.`;
      if (review.consistency === 'conflicting') {
        text += ' The profile is not fully clean-cut, however: the structured form points toward agriculture while the written context also suggests service-led or retail-style activity, so this route should be treated as plausible rather than automatic.';
      } else if (mixedSignals) {
        text += ' The written context contains both agricultural and digital or business-modernisation signals, so CAP remains relevant, but it is being interpreted alongside an ERDF pathway rather than in isolation.';
      }
      text += ` Before proceeding, it is important to verify how ${note.toLowerCase()} and what regional evidence is required for land, operations, or co-financing.`;
      if (tagText) text += ` Tags such as ${tagText.toLowerCase()} can further strengthen the application narrative.`;
      return text;
    }

    let text = `For ${subject}, this recommendation is linked to ${routeTitle}, which is designed around regional competitiveness and enterprise development in ${location}. A ${businessSizeLabel.toLowerCase()} ${businessTypeLabel.toLowerCase()} business aiming to ${goalLabel.toLowerCase()} tends to fit here when the project leans toward modernisation, innovation, or expansion rather than core agricultural production.`;
    if (review.consistency === 'conflicting') {
      text += ' The engine is treating this as a meaningful alternative because the written context introduces service-led, retail, or digital evidence that does not fully match the agricultural reading of the dropdowns.';
    } else if (mixedSignals) {
      text += ' The profile contains both agricultural and ERDF-style signals, so this route stays relevant because the context points to modernisation or digital activity alongside any production-led work.';
    }
    text += ` Before moving forward, it is important to verify how ${note.toLowerCase()} and whether the regional call requires explicit alignment with local economic priorities.`;
    return text;
  }

  if (language === 'es') {
    return isCAP
      ? `Para ${subject}, esta recomendación se apoya en ${routeTitle}, aplicado con especificidades regionales en ${location}. Una empresa ${businessSizeLabel.toLowerCase()} de tipo ${businessTypeLabel.toLowerCase()} que busca ${goalLabel.toLowerCase()} encaja aquí porque CAP se orienta a inversión agraria, sostenibilidad y desarrollo rural.${review.consistency === 'conflicting' ? ' Aun así, el sistema detecta señales mixtas entre actividad agrícola y actividad más comercial o de servicios, por lo que conviene revisar bien la actividad principal declarada.' : mixedSignals ? ' El contexto contiene señales tanto agrarias como de modernización, por lo que CAP se mantiene relevante pero no se interpreta de forma aislada.' : ''} Antes de avanzar, conviene verificar cómo ${note.toLowerCase()} y qué pruebas regionales se exigen.`
      : `Para ${subject}, esta recomendación se relaciona con ${routeTitle}, orientado a competitividad regional y desarrollo empresarial en ${location}. Una empresa ${businessSizeLabel.toLowerCase()} de tipo ${businessTypeLabel.toLowerCase()} que quiere ${goalLabel.toLowerCase()} puede encajar aquí cuando el proyecto se acerca más a modernización, innovación o expansión que a producción agraria pura.${review.consistency === 'conflicting' ? ' El sistema la mantiene alta porque el texto libre introduce señales de servicio, retail o digitalización que modifican la lectura inicial del formulario.' : mixedSignals ? ' El perfil combina señales agrarias y señales más propias de ERDF, por lo que esta vía sigue siendo razonable.' : ''} Antes de continuar, confirme cómo ${note.toLowerCase()} y si la convocatoria exige alineación económica regional.`;
  }

  if (language === 'it') {
    return isCAP
      ? `Per ${subject}, questa raccomandazione deriva da ${routeTitle}, attuato con specificità regionali in ${location}. Un’attività ${businessSizeLabel.toLowerCase()} di tipo ${businessTypeLabel.toLowerCase()} che punta a ${goalLabel.toLowerCase()} trova qui una coerenza naturale perché la CAP sostiene investimenti agricoli, sostenibilità e sviluppo rurale.${review.consistency === 'conflicting' ? ' Il profilo, però, non è del tutto lineare: il testo libero introduce segnali più vicini a servizi o retail, quindi la via CAP va letta con una certa cautela.' : mixedSignals ? ' Il contesto unisce segnali agricoli e segnali di modernizzazione, quindi la CAP resta rilevante ma viene interpretata insieme a una possibile via ERDF.' : ''} Prima di procedere, è opportuno verificare come ${note.toLowerCase()} e quali prove regionali siano richieste.`
      : `Per ${subject}, questa raccomandazione si collega a ${routeTitle}, costruito attorno a competitività regionale e sviluppo d’impresa in ${location}. Un’impresa ${businessSizeLabel.toLowerCase()} di tipo ${businessTypeLabel.toLowerCase()} che vuole ${goalLabel.toLowerCase()} può trovare qui una via più coerente quando il progetto riguarda modernizzazione, innovazione o crescita più che produzione agricola primaria.${review.consistency === 'conflicting' ? ' Il sistema la mantiene alta perché il testo libero introduce segnali di servizi, retail o digitalizzazione che modificano la lettura iniziale del profilo.' : mixedSignals ? ' Il profilo contiene segnali sia agricoli sia tipici dell’ERDF, per cui questa via resta ragionevole.' : ''} Prima di andare avanti, verifichi come ${note.toLowerCase()} e se il bando richiede allineamento con priorità economiche locali.`;
  }

  if (language === 'pl') {
    return isCAP
      ? `W przypadku ${subject} ta rekomendacja wynika z ${routeTitle}, wdrażanego z regionalnymi specyfikami w ${location}. ${businessSizeLabel.toLowerCase()} firma typu ${businessTypeLabel.toLowerCase()}, której celem jest ${goalLabel.toLowerCase()}, znajduje tu naturalne dopasowanie, ponieważ CAP wspiera inwestycje rolnicze, zrównoważenie i rozwój obszarów wiejskich.${review.consistency === 'conflicting' ? ' Profil nie jest jednak całkowicie jednoznaczny: tekst swobodny zawiera też sygnały bardziej usługowe lub handlowe, więc tę ścieżkę trzeba czytać ostrożnie.' : mixedSignals ? ' Kontekst łączy sygnały rolnicze i modernizacyjne, więc CAP pozostaje istotny, ale nie jest interpretowany w oderwaniu od ERDF.' : ''} Przed dalszym krokiem warto sprawdzić, jak ${note.toLowerCase()} oraz jakie dowody regionalne są wymagane.`
      : `W przypadku ${subject} ta rekomendacja wiąże się z ${routeTitle}, nastawionym na konkurencyjność regionalną i rozwój przedsiębiorstw w ${location}. ${businessSizeLabel.toLowerCase()} firma typu ${businessTypeLabel.toLowerCase()}, która chce ${goalLabel.toLowerCase()}, może pasować tu lepiej wtedy, gdy projekt dotyczy modernizacji, innowacji lub wzrostu bardziej niż podstawowej produkcji rolnej.${review.consistency === 'conflicting' ? ' System utrzymuje tę ścieżkę wysoko, ponieważ tekst swobodny wprowadza sygnały usługowe, handlowe lub cyfrowe, które zmieniają początkową interpretację formularza.' : mixedSignals ? ' Profil łączy sygnały rolnicze i typowe dla ERDF, dlatego ta droga pozostaje uzasadniona.' : ''} Przed złożeniem wniosku warto sprawdzić, jak ${note.toLowerCase()} oraz czy nabór wymaga zgodności z lokalnymi priorytetami gospodarczymi.`;
  }

  return isCAP
    ? `Pour ${subject}, cette recommandation repose sur ${routeTitle}, mis en œuvre avec des spécificités régionales en ${location}. Une entreprise ${businessSizeLabel.toLowerCase()} de type ${businessTypeLabel.toLowerCase()} cherchant à ${goalLabel.toLowerCase()} trouve ici une cohérence naturelle, car la CAP soutient l’investissement agricole, la durabilité et le développement rural.${review.consistency === 'conflicting' ? ' Le profil n’est toutefois pas totalement homogène : le texte libre fait aussi apparaître des signaux de services ou de commerce, ce qui invite à traiter cette voie avec prudence.' : mixedSignals ? ' Le contexte combine des signaux agricoles et des signaux de modernisation, de sorte que la CAP reste pertinente sans être interprétée isolément.' : ''} Avant d’aller plus loin, il faut vérifier comment ${note.toLowerCase()} et quels justificatifs régionaux sont demandés.`
    : `Pour ${subject}, cette recommandation s’appuie sur ${routeTitle}, structuré autour de la compétitivité régionale et du développement des entreprises en ${location}. Une entreprise ${businessSizeLabel.toLowerCase()} de type ${businessTypeLabel.toLowerCase()} visant à ${goalLabel.toLowerCase()} peut être mieux orientée ici lorsque le projet relève davantage de la modernisation, de l’innovation ou de la croissance que de la production agricole primaire.${review.consistency === 'conflicting' ? ' Le système maintient cette piste car le texte libre introduit des signaux de services, de commerce ou de numérique qui modifient l’interprétation initiale du formulaire.' : mixedSignals ? ' Le profil combine des signaux agricoles et des signaux typiques de l’ERDF, ce qui maintient cette voie comme une option crédible.' : ''} Avant dépôt, il faut vérifier comment ${note.toLowerCase()} ainsi que l’alignement éventuel avec les priorités économiques régionales.`;
}

function buildDraftSupport({
  program,
  language,
  businessName,
  businessTypeLabel,
  businessSizeLabel,
  goalLabel,
  tagLabels,
  review,
  isCAP,
  route,
}) {
  const subject = businessName || genericBusinessReference(language);
  const routeTitle = route?.programmeTitle || 'the relevant programme route';
  const location = [route?.region, route?.country].filter(Boolean).join(', ');
  const tagText = tagLabels.slice(0, 2).join(', ');
  const routePriority = route?.commonPriorities?.[0];
  const routePriorityTwo = route?.commonPriorities?.[1];
  const routeConstraint = route?.commonConstraints?.[0];
  const routeNote = route?.regionNotes?.[0];
  const programmeFocus = getProgrammeFocus(program, language);
  const programmeDescription = program?.description || '';
  const eligibilityHint = program?.eligibilityHint || '';
  const contextProfile = getContextProfile(review, language);
  const routeApplicantText =
    route?.targetApplicants ||
    programmeFocus.applicantLead ||
    (isCAP
      ? 'farmers, agricultural businesses, and rural producers'
      : 'SMEs, regional businesses, and innovation-led applicants');

  if (language === 'en') {
    return {
      projectSummary: `${subject} is preparing a ${programmeFocus.summaryLead} route under ${routeTitle} in ${location}. The proposed case focuses on a ${businessSizeLabel.toLowerCase()} ${businessTypeLabel.toLowerCase()} business seeking to ${goalLabel.toLowerCase()}, with the project framed through ${programmeFocus.projectHook} and presented for applicants such as ${routeApplicantText.toLowerCase()}.`,
      fitReason: isCAP
        ? `This may fit because ${programmeFocus.fitLead}. In this case, the strongest supporting signals point to ${contextProfile.primarySignal}, which lines up with the route's regional emphasis on ${routePriority || 'rural development'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' The profile review suggests this should still be positioned carefully because some service-led or digital cues are also present.' : ''}`
        : `This may fit because ${programmeFocus.fitLead}. In this case, the strongest supporting signals point to ${contextProfile.primarySignal}, which lines up with the route's regional emphasis on ${routePriority || 'enterprise competitiveness'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' The profile review suggests this route is being strengthened by service-led or digital evidence in the written context.' : ''}`,
      applicationAngle: isCAP
        ? `Position the application around ${programmeFocus.angleLead}, rural value, and a practical investment case linked to ${goalLabel.toLowerCase()}. Lead with ${contextProfile.angleLead} so the authority can see why this belongs in ${routeTitle}.${routePriority ? ` Emphasise ${routePriority} as a named programme priority.` : ''}${programmeDescription ? ` Use the programme logic of "${programmeDescription}" as the core framing.` : ''}`
        : `Position the application around ${programmeFocus.angleLead}, competitiveness, and measurable business improvement linked to ${goalLabel.toLowerCase()}. Lead with ${contextProfile.angleLead} so the authority can see why this belongs in ${routeTitle}.${routePriority ? ` Frame the project in terms of ${routePriority}.` : ''}${programmeDescription ? ` Use the programme logic of "${programmeDescription}" as the core framing.` : ''}`,
      evidenceToPrepare: buildEvidenceToPrepare(language, {
        program,
        isCAP,
        routePriority,
        routePriorityTwo,
        routeConstraint,
        routeNote,
      }),
      preSubmissionChecklist: buildPreSubmissionChecklist(language, {
        program,
        isCAP,
        businessSizeLabel,
        routeConstraint,
        routePriority,
      }),
      firstAuthorityQuestion: buildAuthorityQuestion(language, {
        program,
        isCAP,
        routeTitle,
        review,
      }),
      clarificationPoint:
        review.consistency === 'conflicting'
          ? 'Clarify whether the main business activity should be presented as agricultural production or as service-led / commercial activity.'
          : review.consistency === 'mixed'
            ? 'Clarify which project element is primary so the application route stays focused.'
            : 'Keep the activity description tightly aligned with the route you plan to pursue.',
      verifyBeforeSubmit: `Verify the regional call, company-size rules, activity eligibility, and whether the business should be framed primarily as agricultural production or service-led retail.${tagText ? ` Also check how tags like ${tagText.toLowerCase()} are treated.` : ''}`,
    };
  }

  if (language === 'es') {
    return {
      projectSummary: `${subject} prepara una vía de ${programmeFocus.summaryLead} dentro de ${routeTitle} en ${location}. El caso se centra en una actividad ${businessTypeLabel.toLowerCase()} ${businessSizeLabel.toLowerCase()} que busca ${goalLabel.toLowerCase()}, presentada a través de ${programmeFocus.projectHook} y encuadrada para solicitantes como ${routeApplicantText.toLowerCase()}.`,
      fitReason: isCAP
        ? `Puede encajar porque ${programmeFocus.fitLead}. En este caso, las señales más fuertes apuntan a ${contextProfile.primarySignal}, lo que encaja con el énfasis regional de la ruta en ${routePriority || 'desarrollo rural'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' La revisión del perfil indica que esta vía aún debe justificarse con cuidado porque también aparecen señales de servicio o digitalización.' : ''}`
        : `Puede encajar porque ${programmeFocus.fitLead}. En este caso, las señales más fuertes apuntan a ${contextProfile.primarySignal}, lo que encaja con el énfasis regional de la ruta en ${routePriority || 'competitividad empresarial'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' La revisión del perfil indica que esta vía gana peso gracias a señales de servicio o digitalización en el texto libre.' : ''}`,
      applicationAngle: isCAP
        ? `Plantee la solicitud en torno a ${programmeFocus.angleLead}, valor rural e inversión práctica vinculada a ${goalLabel.toLowerCase()}. Abra el relato con ${contextProfile.angleLead} para que la autoridad vea por qué el caso pertenece a ${routeTitle}.${routePriority ? ` Destaque ${routePriority} como prioridad del programa.` : ''}${programmeDescription ? ` Tome como hilo central la lógica del programa: "${programmeDescription}".` : ''}`
        : `Plantee la solicitud en torno a ${programmeFocus.angleLead}, competitividad y mejora empresarial medible vinculada a ${goalLabel.toLowerCase()}. Abra el relato con ${contextProfile.angleLead} para que la autoridad vea por qué el caso pertenece a ${routeTitle}.${routePriority ? ` Relacione el proyecto con ${routePriority}.` : ''}${programmeDescription ? ` Tome como hilo central la lógica del programa: "${programmeDescription}".` : ''}`,
      evidenceToPrepare: buildEvidenceToPrepare(language, {
        program,
        isCAP,
        routePriority,
        routePriorityTwo,
        routeConstraint,
        routeNote,
      }),
      preSubmissionChecklist: buildPreSubmissionChecklist(language, {
        program,
        isCAP,
        businessSizeLabel,
        routeConstraint,
        routePriority,
      }),
      firstAuthorityQuestion: buildAuthorityQuestion(language, {
        program,
        isCAP,
        routeTitle,
        review,
      }),
      clarificationPoint:
        review.consistency === 'conflicting'
          ? 'Aclare si la actividad principal debe presentarse como producción agraria o como actividad comercial / de servicios.'
          : review.consistency === 'mixed'
            ? 'Aclare qué elemento del proyecto es prioritario para mantener una ruta de solicitud coherente.'
            : 'Mantenga la descripción de la actividad bien alineada con la ruta elegida.',
      verifyBeforeSubmit: `Confirme convocatoria regional, tamaño empresarial, elegibilidad de actividades y si la empresa debe presentarse principalmente como producción agraria o como actividad comercial/servicios.${tagText ? ` Revise también cómo se tratan etiquetas como ${tagText.toLowerCase()}.` : ''}`,
    };
  }

  if (language === 'it') {
    return {
      projectSummary: `${subject} sta preparando un percorso di ${programmeFocus.summaryLead} all’interno di ${routeTitle} in ${location}. Il caso riguarda un’attività ${businessTypeLabel.toLowerCase()} ${businessSizeLabel.toLowerCase()} che vuole ${goalLabel.toLowerCase()}, presentata attraverso ${programmeFocus.projectHook} e riferita a beneficiari come ${routeApplicantText.toLowerCase()}.`,
      fitReason: isCAP
        ? `Può essere adatto perché ${programmeFocus.fitLead}. In questo caso, i segnali più forti indicano ${contextProfile.primarySignal}, in linea con l’enfasi regionale della via su ${routePriority || 'sviluppo rurale'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' La revisione del profilo indica che questa pista richiede comunque un posizionamento attento perché emergono anche segnali di servizi o digitalizzazione.' : ''}`
        : `Può essere adatto perché ${programmeFocus.fitLead}. In questo caso, i segnali più forti indicano ${contextProfile.primarySignal}, in linea con l’enfasi regionale della via su ${routePriority || 'competitività d’impresa'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' La revisione del profilo indica che questa pista è rafforzata da segnali di servizi o digitalizzazione nel testo libero.' : ''}`,
      applicationAngle: isCAP
        ? `Imposti la candidatura attorno a ${programmeFocus.angleLead}, valore rurale e investimento concreto collegato a ${goalLabel.toLowerCase()}. Apra il racconto con ${contextProfile.angleLead} così l’autorità vede subito perché il caso appartiene a ${routeTitle}.${routePriority ? ` Evidenzi ${routePriority} come priorità del programma.` : ''}${programmeDescription ? ` Usi come filo logico la formula del programma: "${programmeDescription}".` : ''}`
        : `Imposti la candidatura attorno a ${programmeFocus.angleLead}, competitività e miglioramento aziendale misurabile collegato a ${goalLabel.toLowerCase()}. Apra il racconto con ${contextProfile.angleLead} così l’autorità vede subito perché il caso appartiene a ${routeTitle}.${routePriority ? ` Colleghi il progetto a ${routePriority}.` : ''}${programmeDescription ? ` Usi come filo logico la formula del programma: "${programmeDescription}".` : ''}`,
      evidenceToPrepare: buildEvidenceToPrepare(language, {
        program,
        isCAP,
        routePriority,
        routePriorityTwo,
        routeConstraint,
        routeNote,
      }),
      preSubmissionChecklist: buildPreSubmissionChecklist(language, {
        program,
        isCAP,
        businessSizeLabel,
        routeConstraint,
        routePriority,
      }),
      firstAuthorityQuestion: buildAuthorityQuestion(language, {
        program,
        isCAP,
        routeTitle,
        review,
      }),
      clarificationPoint:
        review.consistency === 'conflicting'
          ? 'Chiarisca se l’attività principale debba essere presentata come produzione agricola o come attività commerciale / di servizi.'
          : review.consistency === 'mixed'
            ? 'Chiarisca quale elemento del progetto è prioritario per mantenere focalizzata la candidatura.'
            : 'Mantenga la descrizione dell’attività ben allineata con il percorso scelto.',
      verifyBeforeSubmit: `Verifichi bando regionale, dimensione d’impresa, ammissibilità delle attività e se l’impresa debba essere descritta soprattutto come produzione agricola o come attività di servizi/commercio.${tagText ? ` Consideri anche come vengono trattate etichette come ${tagText.toLowerCase()}.` : ''}`,
    };
  }

  if (language === 'pl') {
    return {
      projectSummary: `${subject} przygotowuje ścieżkę dotyczącą ${programmeFocus.summaryLead} w ramach ${routeTitle} w ${location}. Chodzi o działalność ${businessTypeLabel.toLowerCase()} ${businessSizeLabel.toLowerCase()}, która chce ${goalLabel.toLowerCase()}, opisaną przez pryzmat ${programmeFocus.projectHook} i kierowaną do beneficjentów takich jak ${routeApplicantText.toLowerCase()}.`,
      fitReason: isCAP
        ? `Może pasować, ponieważ ${programmeFocus.fitLead}. W tym przypadku najmocniejsze sygnały wskazują na ${contextProfile.primarySignal}, co dobrze łączy się z regionalnym naciskiem ścieżki na ${routePriority || 'rozwój obszarów wiejskich'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' Przegląd profilu pokazuje jednak, że tę ścieżkę nadal trzeba uzasadnić ostrożnie, bo pojawiają się również sygnały usługowe lub cyfrowe.' : ''}`
        : `Może pasować, ponieważ ${programmeFocus.fitLead}. W tym przypadku najmocniejsze sygnały wskazują na ${contextProfile.primarySignal}, co dobrze łączy się z regionalnym naciskiem ścieżki na ${routePriority || 'konkurencyjność firmy'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' Przegląd profilu wskazuje, że ta ścieżka zyskuje na znaczeniu dzięki sygnałom usługowym lub cyfrowym w opisie.' : ''}`,
      applicationAngle: isCAP
        ? `Ustaw wniosek wokół ${programmeFocus.angleLead}, wartości dla obszaru wiejskiego i konkretnej inwestycji związanej z ${goalLabel.toLowerCase()}. Otwórz opis przez ${contextProfile.angleLead}, aby instytucja od razu widziała, dlaczego sprawa pasuje do ${routeTitle}.${routePriority ? ` Podkreśl ${routePriority} jako priorytet programu.` : ''}${programmeDescription ? ` Oprzyj opis na logice programu: "${programmeDescription}".` : ''}`
        : `Ustaw wniosek wokół ${programmeFocus.angleLead}, konkurencyjności i mierzalnej poprawy firmy związanej z ${goalLabel.toLowerCase()}. Otwórz opis przez ${contextProfile.angleLead}, aby instytucja od razu widziała, dlaczego sprawa pasuje do ${routeTitle}.${routePriority ? ` Powiąż projekt z ${routePriority}.` : ''}${programmeDescription ? ` Oprzyj opis na logice programu: "${programmeDescription}".` : ''}`,
      evidenceToPrepare: buildEvidenceToPrepare(language, {
        program,
        isCAP,
        routePriority,
        routePriorityTwo,
        routeConstraint,
        routeNote,
      }),
      preSubmissionChecklist: buildPreSubmissionChecklist(language, {
        program,
        isCAP,
        businessSizeLabel,
        routeConstraint,
        routePriority,
      }),
      firstAuthorityQuestion: buildAuthorityQuestion(language, {
        program,
        isCAP,
        routeTitle,
        review,
      }),
      clarificationPoint:
        review.consistency === 'conflicting'
          ? 'Doprecyzuj, czy główna działalność powinna być przedstawiana jako produkcja rolna czy jako działalność usługowa / handlowa.'
          : review.consistency === 'mixed'
            ? 'Doprecyzuj, który element projektu jest najważniejszy, aby utrzymać spójną ścieżkę wniosku.'
            : 'Utrzymaj opis działalności ściśle zgodny z wybraną ścieżką.',
      verifyBeforeSubmit: `Sprawdź nabór regionalny, wielkość firmy, kwalifikowalność działań oraz czy działalność powinna być opisana przede wszystkim jako produkcja rolnicza czy raczej jako handel/usługi.${tagText ? ` Warto też sprawdzić, jak traktowane są oznaczenia takie jak ${tagText.toLowerCase()}.` : ''}`,
    };
  }

  return {
    projectSummary: `${subject} prépare une voie de ${programmeFocus.summaryLead} au titre de ${routeTitle} en ${location}. Le dossier concerne une activité ${businessTypeLabel.toLowerCase()} ${businessSizeLabel.toLowerCase()} qui vise à ${goalLabel.toLowerCase()}, présentée autour de ${programmeFocus.projectHook} et pensée pour des bénéficiaires comme ${routeApplicantText.toLowerCase()}.`,
    fitReason: isCAP
      ? `Cela peut convenir car ${programmeFocus.fitLead}. Ici, les signaux les plus forts pointent vers ${contextProfile.primarySignal}, ce qui rejoint l’accent régional mis sur ${routePriority || 'le développement rural'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' La revue du profil montre toutefois que cette piste demande encore une présentation prudente car des signaux de services ou de numérique apparaissent aussi.' : ''}`
      : `Cela peut convenir car ${programmeFocus.fitLead}. Ici, les signaux les plus forts pointent vers ${contextProfile.primarySignal}, ce qui rejoint l’accent régional mis sur ${routePriority || 'la compétitivité de l’entreprise'}.${eligibilityHint ? ` ${eligibilityHint}` : ''}${review.consistency !== 'consistent' ? ' La revue du profil montre que cette piste est renforcée par des signaux de services ou de numérique présents dans le texte libre.' : ''}`,
    applicationAngle: isCAP
      ? `Présentez la candidature autour de ${programmeFocus.angleLead}, d’une valeur rurale claire et d’un investissement concret lié à ${goalLabel.toLowerCase()}. Ouvrez l’argumentaire par ${contextProfile.angleLead} afin que l’autorité comprenne immédiatement pourquoi le dossier relève de ${routeTitle}.${routePriority ? ` Mettez en avant ${routePriority} comme priorité du programme.` : ''}${programmeDescription ? ` Utilisez comme fil rouge la logique du programme : "${programmeDescription}".` : ''}`
      : `Présentez la candidature autour de ${programmeFocus.angleLead}, de la compétitivité et d’une amélioration mesurable liée à ${goalLabel.toLowerCase()}. Ouvrez l’argumentaire par ${contextProfile.angleLead} afin que l’autorité comprenne immédiatement pourquoi le dossier relève de ${routeTitle}.${routePriority ? ` Rattachez le projet à ${routePriority}.` : ''}${programmeDescription ? ` Utilisez comme fil rouge la logique du programme : "${programmeDescription}".` : ''}`,
    evidenceToPrepare: buildEvidenceToPrepare(language, {
      program,
      isCAP,
      routePriority,
      routePriorityTwo,
      routeConstraint,
      routeNote,
    }),
    preSubmissionChecklist: buildPreSubmissionChecklist(language, {
      program,
      isCAP,
      businessSizeLabel,
      routeConstraint,
      routePriority,
    }),
    firstAuthorityQuestion: buildAuthorityQuestion(language, {
      program,
      isCAP,
      routeTitle,
      review,
    }),
    clarificationPoint:
      review.consistency === 'conflicting'
        ? 'Clarifiez si l’activité principale doit être présentée comme production agricole ou comme activité de services / commerce.'
        : review.consistency === 'mixed'
          ? 'Clarifiez quel élément du projet est principal afin de garder un dossier cohérent.'
          : 'Gardez la description de l’activité bien alignée avec la voie retenue.',
    verifyBeforeSubmit: `Vérifiez l’appel régional, la taille de l’entreprise, l’éligibilité des activités et si l’entreprise doit être présentée d’abord comme production agricole ou comme activité de commerce/services.${tagText ? ` Vérifiez aussi comment sont appréciées des étiquettes comme ${tagText.toLowerCase()}.` : ''}`,
  };
}

function buildEvidenceToPrepare(
  language,
  { program, isCAP, routePriority, routePriorityTwo, routeConstraint, routeNote },
) {
  const programmeDocument =
    program?.id === 'cap-green-transition-support'
      ? isCAP
        ? 'a sustainability or resource-efficiency plan'
        : 'a project plan'
      : program?.id === 'erdf-sme-digitalisation-grant'
        ? 'a digital tools or systems plan'
        : program?.id === 'erdf-regional-growth-fund'
          ? 'a growth and jobs plan'
          : isCAP
            ? 'an agricultural investment plan'
            : 'a business investment plan';
  const priorityText = routePriority || (isCAP ? 'agricultural investment' : 'business modernisation');
  const secondaryPriority = routePriorityTwo || (isCAP ? 'rural development' : 'competitiveness');
  const constraintText =
    routeConstraint || (isCAP ? 'eligibility depends on the regional call' : 'regional alignment matters');
  const noteText = routeNote || (isCAP ? 'regional implementation affects eligibility pathways' : 'regional priorities shape access');

  if (language === 'es') {
    return [
      `Una nota breve que conecte el proyecto con prioridades como ${priorityText} y ${secondaryPriority}.`,
      `Documentación básica y ${programmeDocument} que responda a requisitos como: ${constraintText}.`,
      `Presupuesto inicial y breve justificación regional, teniendo en cuenta que ${noteText}.`,
    ];
  }

  if (language === 'it') {
    return [
      `Una breve nota che colleghi il progetto a priorità come ${priorityText} e ${secondaryPriority}.`,
      `Documentazione di base e ${programmeDocument} che risponda a requisiti come: ${constraintText}.`,
      `Budget iniziale e breve motivazione territoriale, tenendo conto che ${noteText}.`,
    ];
  }

  if (language === 'pl') {
    return [
      `Krótka notatka łącząca projekt z priorytetami takimi jak ${priorityText} i ${secondaryPriority}.`,
      `Podstawowe dokumenty oraz ${programmeDocument}, odpowiadające na wymagania takie jak: ${constraintText}.`,
      `Wstępny budżet i krótkie uzasadnienie regionalne, z uwzględnieniem że ${noteText}.`,
    ];
  }

  if (language === 'fr') {
    return [
      `Une courte note reliant le projet à des priorités telles que ${priorityText} et ${secondaryPriority}.`,
      `Des pièces de base et ${programmeDocument} répondant à des exigences comme : ${constraintText}.`,
      `Un budget initial et une justification territoriale courte, en tenant compte du fait que ${noteText}.`,
    ];
  }

  return [
    `A short note linking the project to priorities such as ${priorityText} and ${secondaryPriority}.`,
    `Basic documents plus ${programmeDocument} that respond to constraints such as: ${constraintText}.`,
    `An initial budget and short regional justification, bearing in mind that ${noteText}.`,
  ];
}

function buildPreSubmissionChecklist(
  language,
  { program, isCAP, businessSizeLabel, routeConstraint, routePriority },
) {
  const programmeCheck =
    program?.id === 'cap-green-transition-support'
      ? 'the environmental upgrade is clearly described and costed'
      : program?.id === 'cap-rural-development-grant'
        ? 'the rural investment and farm-operation rationale are clearly evidenced'
        : program?.id === 'erdf-sme-digitalisation-grant'
          ? 'the digital improvement is linked to measurable business change'
          : program?.id === 'erdf-regional-growth-fund'
            ? 'the growth case is linked to jobs, scale, or competitiveness'
            : isCAP
              ? 'the agricultural improvement case is clearly evidenced'
              : 'the business-improvement case is clearly evidenced';
  const sizeText = businessSizeLabel?.toLowerCase() || 'business';
  const constraintText =
    routeConstraint || (isCAP ? 'regional call conditions can change' : 'regional programme conditions can change');
  const priorityText = routePriority || (isCAP ? 'agricultural investment' : 'business modernisation');

  if (language === 'es') {
    return [
      `Confirmar que la empresa ${sizeText} encaja con el tamaño y tipo de beneficiario admitidos.`,
      `Comprobar que ${programmeCheck} y que el proyecto puede presentarse claramente bajo la prioridad ${priorityText}.`,
      `Revisar la convocatoria actual porque ${constraintText}.`,
    ];
  }

  if (language === 'it') {
    return [
      `Confermare che l’impresa ${sizeText} rientri nella dimensione e nella categoria di beneficiario ammesse.`,
      `Verificare che ${programmeCheck} e che il progetto possa essere presentato chiaramente sotto la priorità ${priorityText}.`,
      `Controllare il bando attuale perché ${constraintText}.`,
    ];
  }

  if (language === 'pl') {
    return [
      `Potwierdzić, że firma ${sizeText} mieści się w dopuszczalnej wielkości i kategorii beneficjenta.`,
      `Sprawdzić, czy ${programmeCheck} oraz czy projekt można jasno opisać w ramach priorytetu ${priorityText}.`,
      `Przejrzeć aktualny nabór, ponieważ ${constraintText}.`,
    ];
  }

  if (language === 'fr') {
    return [
      `Confirmer que l’entreprise ${sizeText} correspond bien à la taille et à la catégorie de bénéficiaire visées.`,
      `Vérifier que ${programmeCheck} et que le projet peut être présenté clairement sous la priorité ${priorityText}.`,
      `Relire l’appel en cours car ${constraintText}.`,
    ];
  }

  return [
    `Confirm the ${sizeText} business fits the intended beneficiary size and category.`,
    `Check that ${programmeCheck} and that the project can be framed clearly under the priority of ${priorityText}.`,
    `Review the live call conditions because ${constraintText}.`,
  ];
}

function buildAuthorityQuestion(language, { program, isCAP, routeTitle, review }) {
  const programmeQuestionFocus =
    program?.id === 'cap-green-transition-support'
      ? 'what sustainability evidence or environmental metrics'
      : program?.id === 'cap-rural-development-grant'
        ? 'what farm-operation or rural-delivery evidence'
        : program?.id === 'erdf-sme-digitalisation-grant'
          ? 'what digital-adoption or systems-improvement evidence'
          : program?.id === 'erdf-regional-growth-fund'
            ? 'what growth, hiring, or competitiveness evidence'
            : isCAP
              ? 'what agricultural or rural evidence'
              : 'what business-improvement evidence';
  if (language === 'es') {
    return review.consistency === 'conflicting'
      ? `Pregunte a la autoridad de ${routeTitle} si la actividad debe presentarse como producción agraria o como actividad comercial/servicios para esta línea.`
      : isCAP
        ? `Pregunte a la autoridad de ${routeTitle} qué prueba regional esperan para demostrar actividad agraria o rural y ${programmeQuestionFocus} en este caso.`
        : `Pregunte a la autoridad de ${routeTitle} cómo esperan que una pyme describa ${programmeQuestionFocus} y el impacto regional del proyecto.`;
  }

  if (language === 'it') {
    return review.consistency === 'conflicting'
      ? `Chieda all’autorità di ${routeTitle} se l’attività debba essere presentata come produzione agricola oppure come attività commerciale/di servizi per questa misura.`
      : isCAP
        ? `Chieda all’autorità di ${routeTitle} quale prova regionale si aspettano per dimostrare l’attività agricola o rurale e ${programmeQuestionFocus} in questo caso.`
        : `Chieda all’autorità di ${routeTitle} come si aspettano che una PMI descriva ${programmeQuestionFocus} e l’impatto regionale del progetto.`;
  }

  if (language === 'pl') {
    return review.consistency === 'conflicting'
      ? `Zapytaj instytucję odpowiedzialną za ${routeTitle}, czy działalność powinna być przedstawiona jako produkcja rolna czy jako handel/usługi w tej ścieżce.`
      : isCAP
        ? `Zapytaj instytucję odpowiedzialną za ${routeTitle}, jakiego regionalnego dowodu oczekują, aby potwierdzić działalność rolniczą lub wiejską oraz ${programmeQuestionFocus} w tym przypadku.`
        : `Zapytaj instytucję odpowiedzialną za ${routeTitle}, jak MŚP powinno opisać ${programmeQuestionFocus} oraz regionalny wpływ projektu.`;
  }

  if (language === 'fr') {
    return review.consistency === 'conflicting'
      ? `Demandez à l’autorité de ${routeTitle} si l’activité doit être présentée comme production agricole ou comme activité de commerce/services pour cette voie.`
      : isCAP
        ? `Demandez à l’autorité de ${routeTitle} quel justificatif régional elle attend pour démontrer l’activité agricole ou rurale ainsi que ${programmeQuestionFocus} dans ce cas.`
        : `Demandez à l’autorité de ${routeTitle} comment une PME doit présenter ${programmeQuestionFocus} et l’impact régional du projet.`;
  }

  return review.consistency === 'conflicting'
    ? `Ask the ${routeTitle} authority whether this activity should be framed as agricultural production or as service-led/commercial activity for this route.`
    : isCAP
      ? `Ask the ${routeTitle} authority what regional evidence they expect to see for agricultural or rural activity, and specifically ${programmeQuestionFocus}, in a case like this.`
      : `Ask the ${routeTitle} authority how they expect an SME to describe ${programmeQuestionFocus} and the wider regional impact of the project.`;
}

function getContextProfile(review, language) {
  const hasCap = review.signals.capHits > 0;
  const hasErdf = review.signals.erdfHits > 0;
  const hasService = review.signals.serviceHits > 0;

  const defaults = {
    en: {
      agricultural: {
        primarySignal: 'agricultural and rural-production evidence',
        angleLead: 'the operational farm need and the rural delivery case',
      },
      digital: {
        primarySignal: 'digital or modernisation evidence',
        angleLead: 'the business problem and the digital or systems change proposed',
      },
      service: {
        primarySignal: 'service-led or market-facing activity',
        angleLead: 'the client-facing service offer and the resulting business improvement',
      },
      mixed: {
        primarySignal: 'a mixed profile combining agricultural and modernisation signals',
        angleLead: 'the primary project purpose and the strongest implementation track',
      },
    },
    es: {
      agricultural: {
        primarySignal: 'evidencia agraria y de producción rural',
        angleLead: 'la necesidad operativa agraria y el valor rural del proyecto',
      },
      digital: {
        primarySignal: 'evidencia digital o de modernización',
        angleLead: 'el problema empresarial y el cambio digital o de sistemas propuesto',
      },
      service: {
        primarySignal: 'actividad orientada a servicios o al mercado',
        angleLead: 'la oferta de servicios al cliente y la mejora empresarial resultante',
      },
      mixed: {
        primarySignal: 'un perfil mixto con señales agrarias y de modernización',
        angleLead: 'el propósito principal del proyecto y el eje de implementación más fuerte',
      },
    },
    it: {
      agricultural: {
        primarySignal: 'evidenza agricola e di produzione rurale',
        angleLead: 'il bisogno operativo agricolo e il valore rurale del progetto',
      },
      digital: {
        primarySignal: 'evidenza digitale o di modernizzazione',
        angleLead: 'il problema aziendale e il cambiamento digitale o di sistema proposto',
      },
      service: {
        primarySignal: 'attività orientata ai servizi o al mercato',
        angleLead: 'l’offerta di servizi verso il cliente e il miglioramento aziendale risultante',
      },
      mixed: {
        primarySignal: 'un profilo misto con segnali agricoli e di modernizzazione',
        angleLead: 'lo scopo principale del progetto e il filone di attuazione più forte',
      },
    },
    pl: {
      agricultural: {
        primarySignal: 'dowody działalności rolniczej i produkcji wiejskiej',
        angleLead: 'operacyjną potrzebę gospodarstwa i wartość projektu dla obszaru wiejskiego',
      },
      digital: {
        primarySignal: 'dowody cyfrowe lub modernizacyjne',
        angleLead: 'problem firmy oraz proponowaną zmianę cyfrową lub systemową',
      },
      service: {
        primarySignal: 'działalność usługową lub rynkową',
        angleLead: 'ofertę usługową dla klientów i wynikającą z niej poprawę biznesową',
      },
      mixed: {
        primarySignal: 'profil mieszany z sygnałami rolniczymi i modernizacyjnymi',
        angleLead: 'główny cel projektu i najsilniejszy tor wdrożenia',
      },
    },
    fr: {
      agricultural: {
        primarySignal: 'des éléments agricoles et de production rurale',
        angleLead: 'le besoin opérationnel agricole et la valeur rurale du projet',
      },
      digital: {
        primarySignal: 'des éléments numériques ou de modernisation',
        angleLead: 'le problème d’entreprise et le changement numérique ou système proposé',
      },
      service: {
        primarySignal: 'une activité orientée services ou marché',
        angleLead: 'l’offre de service tournée vers le client et l’amélioration d’entreprise attendue',
      },
      mixed: {
        primarySignal: 'un profil mixte combinant signaux agricoles et de modernisation',
        angleLead: 'l’objectif principal du projet et le levier d’exécution le plus fort',
      },
    },
  };

  const set = defaults[language] || defaults.en;

  if (hasCap && hasErdf) return set.mixed;
  if (hasCap) return set.agricultural;
  if (hasErdf) return set.digital;
  if (hasService) return set.service;
  return set.mixed;
}

function getProgrammeFocus(program, language) {
  const map = {
    en: {
      'cap-rural-development-grant': {
        summaryLead: 'rural business investment',
        projectHook: 'farm resilience and rural operations',
        fitLead: 'the programme is meant for rural business development and operational resilience',
        angleLead: 'farm resilience, operational improvement, and rural delivery',
      },
      'cap-green-transition-support': {
        summaryLead: 'green transition investment',
        projectHook: 'sustainability, resource efficiency, and greener operations',
        fitLead: 'the programme is designed for environmental upgrade and greener rural delivery',
        angleLead: 'environmental upgrade, resource efficiency, and greener delivery',
      },
      'erdf-sme-digitalisation-grant': {
        summaryLead: 'digitalisation and systems improvement',
        projectHook: 'software, digital tools, and process modernisation',
        fitLead: 'the programme is targeted at SME digital adoption and operational modernisation',
        angleLead: 'digital adoption, systems change, and measurable business modernisation',
      },
      'erdf-regional-growth-fund': {
        summaryLead: 'regional business growth',
        projectHook: 'expansion, jobs, and competitiveness',
        fitLead: 'the programme is aimed at expansion, competitiveness, and business growth',
        angleLead: 'growth, job creation, and regional competitiveness',
      },
    },
    es: {
      'cap-rural-development-grant': {
        summaryLead: 'inversión para desarrollo rural',
        projectHook: 'resiliencia agraria y operaciones rurales',
        fitLead: 'el programa está pensado para desarrollo empresarial rural y resiliencia operativa',
        angleLead: 'resiliencia agraria, mejora operativa y valor rural',
      },
      'cap-green-transition-support': {
        summaryLead: 'inversión para transición verde',
        projectHook: 'sostenibilidad, eficiencia de recursos y operaciones más verdes',
        fitLead: 'el programa está pensado para mejora ambiental y transición rural más verde',
        angleLead: 'mejora ambiental, eficiencia de recursos y transición verde',
      },
      'erdf-sme-digitalisation-grant': {
        summaryLead: 'digitalización y mejora de sistemas',
        projectHook: 'software, herramientas digitales y modernización de procesos',
        fitLead: 'el programa se dirige a adopción digital pyme y modernización operativa',
        angleLead: 'adopción digital, cambio de sistemas y modernización medible',
      },
      'erdf-regional-growth-fund': {
        summaryLead: 'crecimiento empresarial regional',
        projectHook: 'expansión, empleo y competitividad',
        fitLead: 'el programa está orientado a expansión, competitividad y crecimiento empresarial',
        angleLead: 'crecimiento, creación de empleo y competitividad regional',
      },
    },
    it: {
      'cap-rural-development-grant': {
        summaryLead: 'investimento per lo sviluppo rurale',
        projectHook: 'resilienza agricola e operatività rurale',
        fitLead: 'il programma è pensato per sviluppo d’impresa rurale e resilienza operativa',
        angleLead: 'resilienza agricola, miglioramento operativo e valore rurale',
      },
      'cap-green-transition-support': {
        summaryLead: 'investimento per la transizione verde',
        projectHook: 'sostenibilità, efficienza delle risorse e operazioni più verdi',
        fitLead: 'il programma è pensato per miglioramento ambientale e transizione rurale più verde',
        angleLead: 'miglioramento ambientale, efficienza delle risorse e transizione verde',
      },
      'erdf-sme-digitalisation-grant': {
        summaryLead: 'digitalizzazione e miglioramento dei sistemi',
        projectHook: 'software, strumenti digitali e modernizzazione dei processi',
        fitLead: 'il programma è rivolto ad adozione digitale delle PMI e modernizzazione operativa',
        angleLead: 'adozione digitale, cambiamento dei sistemi e modernizzazione misurabile',
      },
      'erdf-regional-growth-fund': {
        summaryLead: 'crescita aziendale regionale',
        projectHook: 'espansione, occupazione e competitività',
        fitLead: 'il programma è orientato a espansione, competitività e crescita d’impresa',
        angleLead: 'crescita, creazione di lavoro e competitività regionale',
      },
    },
    pl: {
      'cap-rural-development-grant': {
        summaryLead: 'inwestycja w rozwój obszarów wiejskich',
        projectHook: 'odporność gospodarstwa i działalność wiejską',
        fitLead: 'program służy rozwojowi działalności wiejskiej i odporności operacyjnej',
        angleLead: 'odporność gospodarstwa, poprawa operacyjna i wartość dla obszaru wiejskiego',
      },
      'cap-green-transition-support': {
        summaryLead: 'inwestycja w zieloną transformację',
        projectHook: 'zrównoważenie, efektywność zasobów i bardziej zielone działania',
        fitLead: 'program jest przeznaczony dla poprawy środowiskowej i bardziej zielonej działalności wiejskiej',
        angleLead: 'poprawa środowiskowa, efektywność zasobów i zielona transformacja',
      },
      'erdf-sme-digitalisation-grant': {
        summaryLead: 'cyfryzacja i usprawnienie systemów',
        projectHook: 'oprogramowanie, narzędzia cyfrowe i modernizacja procesów',
        fitLead: 'program jest skierowany na cyfrowe wdrożenia MŚP i modernizację operacyjną',
        angleLead: 'wdrożenie cyfrowe, zmiana systemów i mierzalna modernizacja',
      },
      'erdf-regional-growth-fund': {
        summaryLead: 'regionalny wzrost firmy',
        projectHook: 'ekspansję, miejsca pracy i konkurencyjność',
        fitLead: 'program jest ukierunkowany na wzrost, konkurencyjność i rozwój firmy',
        angleLead: 'wzrost, tworzenie miejsc pracy i konkurencyjność regionalną',
      },
    },
    fr: {
      'cap-rural-development-grant': {
        summaryLead: 'investissement de développement rural',
        projectHook: 'résilience agricole et activité rurale',
        fitLead: 'le programme vise le développement des activités rurales et la résilience opérationnelle',
        angleLead: 'résilience agricole, amélioration opérationnelle et valeur rurale',
      },
      'cap-green-transition-support': {
        summaryLead: 'investissement de transition verte',
        projectHook: 'durabilité, efficacité des ressources et fonctionnement plus vert',
        fitLead: 'le programme est orienté vers la montée en qualité environnementale et la transition verte en milieu rural',
        angleLead: 'amélioration environnementale, efficacité des ressources et transition verte',
      },
      'erdf-sme-digitalisation-grant': {
        summaryLead: 'digitalisation et amélioration des systèmes',
        projectHook: 'logiciels, outils numériques et modernisation des processus',
        fitLead: 'le programme est conçu pour l’adoption numérique des PME et la modernisation opérationnelle',
        angleLead: 'adoption numérique, transformation des systèmes et modernisation mesurable',
      },
      'erdf-regional-growth-fund': {
        summaryLead: 'croissance régionale de l’entreprise',
        projectHook: 'croissance, emploi et compétitivité',
        fitLead: 'le programme est axé sur la croissance, la compétitivité et le développement de l’entreprise',
        angleLead: 'croissance, création d’emplois et compétitivité régionale',
      },
    },
  };

  return (
    map[language]?.[program?.id] ||
    map.en[program?.id] || {
      summaryLead: 'programme-aligned investment',
      projectHook: 'the route priorities and business context',
      fitLead: 'the programme logic aligns with the route and business context',
      angleLead: 'the route priorities and measurable project benefits',
    }
  );
}

function buildRequirements(language, fundType) {
  const map = {
    en: {
      cap: [
        'Proof of rural or agricultural activity',
        'Business or farm registration details',
        'A short investment note covering equipment, land, irrigation, sustainability, or operational improvements',
      ],
      erdf: [
        'Business registration details',
        'Recent financial or operating information',
        'A short project note covering digital upgrades, growth plans, staffing, or competitiveness improvements',
      ],
    },
    es: {
      cap: [
        'Prueba de actividad rural o agraria',
        'Datos de registro de la empresa o explotación',
        'Una nota breve de inversión sobre equipamiento, tierra, riego, sostenibilidad o mejoras operativas',
      ],
      erdf: [
        'Datos de registro de la empresa',
        'Información financiera u operativa reciente',
        'Una nota breve del proyecto sobre mejoras digitales, crecimiento, contratación o competitividad',
      ],
    },
    it: {
      cap: [
        'Prova dell’attività rurale o agricola',
        'Dati di registrazione dell’impresa o dell’azienda agricola',
        'Una breve nota d’investimento su attrezzature, terreni, irrigazione, sostenibilità o miglioramenti operativi',
      ],
      erdf: [
        'Dati di registrazione dell’impresa',
        'Informazioni finanziarie o operative recenti',
        'Una breve nota di progetto su miglioramenti digitali, crescita, assunzioni o competitività',
      ],
    },
    pl: {
      cap: [
        'Dowód prowadzenia działalności wiejskiej lub rolniczej',
        'Dane rejestracyjne firmy lub gospodarstwa',
        'Krótka notatka inwestycyjna dotycząca sprzętu, ziemi, nawadniania, zrównoważenia lub usprawnień operacyjnych',
      ],
      erdf: [
        'Dane rejestracyjne firmy',
        'Najnowsze informacje finansowe lub operacyjne',
        'Krótka notatka projektowa dotycząca cyfryzacji, wzrostu, zatrudnienia lub poprawy konkurencyjności',
      ],
    },
    fr: {
      cap: [
        'Preuve d’activité rurale ou agricole',
        'Éléments d’enregistrement de l’entreprise ou de l’exploitation',
        'Une courte note d’investissement sur les équipements, le foncier, l’irrigation, la durabilité ou les améliorations opérationnelles',
      ],
      erdf: [
        'Éléments d’enregistrement de l’entreprise',
        'Informations financières ou opérationnelles récentes',
        'Une courte note de projet sur les améliorations numériques, la croissance, le recrutement ou la compétitivité',
      ],
    },
  };

  return map[language]?.[fundType] ?? map.en[fundType];
}

function sanitizeRequirements(requirements, fallbackRequirements) {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return fallbackRequirements;
  }

  const cleaned = requirements
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length >= 12)
    .filter(
      (entry) =>
        !['digitize', 'digitalize', 'expand operations', 'hire staff', 'buy equipment'].includes(
          entry.toLowerCase(),
        ),
    );

  return cleaned.length > 0 ? cleaned.slice(0, 3) : fallbackRequirements;
}

function buildNextStep(language, isCAP, review, route) {
  const routeTitle = route?.programmeTitle || 'the relevant programme route';
  const routeNote = route?.commonConstraints?.[0] || 'eligibility can depend on the regional call';
  const variant = isCAP ? 'cap' : review.signals.erdfHits > 0 ? 'erdfDigital' : 'erdf';
  const map = {
    en: {
      cap: `Open the official application page for ${routeTitle}, then confirm land, operational, and regional-call requirements because ${routeNote}.`,
      erdf: `Open the official application page for ${routeTitle}, then map the project against regional competitiveness priorities before drafting the submission.`,
      erdfDigital: `Open the official application page for ${routeTitle}, then prepare a short note on the website, software, booking, or online-sales upgrade you want to fund.`,
    },
    es: {
      cap: `Abra la página oficial de solicitud de ${routeTitle} y confirme requisitos de tierra, actividad y convocatoria regional, porque ${routeNote}.`,
      erdf: `Abra la página oficial de solicitud de ${routeTitle} y relacione el proyecto con las prioridades regionales de competitividad antes de redactar la solicitud.`,
      erdfDigital: `Abra la página oficial de solicitud de ${routeTitle} y prepare una nota breve sobre la mejora de web, software, reservas o ventas online que quiere financiar.`,
    },
    it: {
      cap: `Apra la pagina ufficiale di candidatura di ${routeTitle} e confermi requisiti su terreni, attività e bando regionale, perché ${routeNote}.`,
      erdf: `Apra la pagina ufficiale di candidatura di ${routeTitle} e colleghi il progetto alle priorità regionali di competitività prima di scrivere la candidatura.`,
      erdfDigital: `Apra la pagina ufficiale di candidatura di ${routeTitle} e prepari una breve nota sul miglioramento di sito web, software, prenotazioni o vendite online che vuole finanziare.`,
    },
    pl: {
      cap: `Otwórz oficjalną stronę aplikacyjną ${routeTitle} i potwierdź wymagania dotyczące ziemi, działalności oraz naboru regionalnego, ponieważ ${routeNote}.`,
      erdf: `Otwórz oficjalną stronę aplikacyjną ${routeTitle} i powiąż projekt z regionalnymi priorytetami konkurencyjności przed przygotowaniem wniosku.`,
      erdfDigital: `Otwórz oficjalną stronę aplikacyjną ${routeTitle} i przygotuj krótką notatkę o planowanej poprawie strony internetowej, oprogramowania, rezerwacji lub sprzedaży online.`,
    },
    fr: {
      cap: `Ouvrez la page officielle de candidature de ${routeTitle} puis confirmez les exigences liées au foncier, à l’activité et à l’appel régional, car ${routeNote}.`,
      erdf: `Ouvrez la page officielle de candidature de ${routeTitle} puis rattachez le projet aux priorités régionales de compétitivité avant de préparer le dossier.`,
      erdfDigital: `Ouvrez la page officielle de candidature de ${routeTitle} puis préparez une courte note sur l’amélioration du site web, du logiciel, de la réservation ou de la vente en ligne que vous souhaitez financer.`,
    },
  };

  return map[language]?.[variant] ?? map.en[variant];
}

function buildEstimatedTimeline(language, program, route) {
  const prepTimeline =
    program?.id === 'cap-green-transition-support'
      ? '3 to 5 weeks to prepare the environmental and investment case'
      : program?.id === 'erdf-sme-digitalisation-grant'
        ? '2 to 4 weeks to define the digital project and gather business information'
        : program?.id === 'erdf-regional-growth-fund'
          ? '3 to 6 weeks to frame growth, jobs, and competitiveness evidence'
          : '2 to 5 weeks to prepare the project and supporting evidence';
  const submissionTimeline = route
    ? 'submission timing depends on the live regional or national call'
    : 'submission timing depends on when a suitable call opens';
  const reviewTimeline =
    program?.fundType === 'CAP'
      ? 'review can take roughly 2 to 4 months once a valid call is open'
      : 'review can take roughly 6 to 12 weeks, depending on the regional programme';

  const map = {
    en: {
      prep: `Preparation: ${prepTimeline}.`,
      submit: `Submission: ${submissionTimeline}.`,
      review: `Review: ${reviewTimeline}.`,
    },
    es: {
      prep: `Preparación: ${
        program?.id === 'cap-green-transition-support'
          ? '3 a 5 semanas para preparar la parte ambiental y de inversión'
          : program?.id === 'erdf-sme-digitalisation-grant'
            ? '2 a 4 semanas para definir el proyecto digital y reunir información de la empresa'
            : program?.id === 'erdf-regional-growth-fund'
              ? '3 a 6 semanas para estructurar crecimiento, empleo y competitividad'
              : '2 a 5 semanas para preparar el proyecto y las pruebas de apoyo'
      }.`,
      submit: `Presentación: ${
        route
          ? 'depende de la convocatoria regional o nacional activa'
          : 'depende de cuándo se abra una convocatoria adecuada'
      }.`,
      review: `Revisión: ${
        program?.fundType === 'CAP'
          ? 'puede tardar aproximadamente de 2 a 4 meses una vez abierta la convocatoria válida'
          : 'puede tardar aproximadamente de 6 a 12 semanas según el programa regional'
      }.`,
    },
    it: {
      prep: `Preparazione: ${
        program?.id === 'cap-green-transition-support'
          ? 'da 3 a 5 settimane per costruire la parte ambientale e di investimento'
          : program?.id === 'erdf-sme-digitalisation-grant'
            ? 'da 2 a 4 settimane per definire il progetto digitale e raccogliere dati aziendali'
            : program?.id === 'erdf-regional-growth-fund'
              ? 'da 3 a 6 settimane per impostare crescita, occupazione e competitività'
              : 'da 2 a 5 settimane per preparare il progetto e le prove di supporto'
      }.`,
      submit: `Presentazione: ${
        route
          ? 'dipende dal bando regionale o nazionale attivo'
          : 'dipende dall’apertura di un bando adatto'
      }.`,
      review: `Valutazione: ${
        program?.fundType === 'CAP'
          ? 'può richiedere circa 2-4 mesi una volta aperto un bando valido'
          : 'può richiedere circa 6-12 settimane a seconda del programma regionale'
      }.`,
    },
    pl: {
      prep: `Przygotowanie: ${
        program?.id === 'cap-green-transition-support'
          ? '3 do 5 tygodni na przygotowanie części środowiskowej i inwestycyjnej'
          : program?.id === 'erdf-sme-digitalisation-grant'
            ? '2 do 4 tygodni na zdefiniowanie projektu cyfrowego i zebranie danych firmy'
            : program?.id === 'erdf-regional-growth-fund'
              ? '3 do 6 tygodni na opisanie wzrostu, miejsc pracy i konkurencyjności'
              : '2 do 5 tygodni na przygotowanie projektu i materiałów'
      }.`,
      submit: `Złożenie: ${
        route
          ? 'zależy od aktualnego naboru regionalnego lub krajowego'
          : 'zależy od otwarcia odpowiedniego naboru'
      }.`,
      review: `Ocena: ${
        program?.fundType === 'CAP'
          ? 'może potrwać około 2-4 miesięcy po otwarciu właściwego naboru'
          : 'może potrwać około 6-12 tygodni, zależnie od programu regionalnego'
      }.`,
    },
    fr: {
      prep: `Préparation : ${
        program?.id === 'cap-green-transition-support'
          ? '3 à 5 semaines pour préparer le volet environnemental et d’investissement'
          : program?.id === 'erdf-sme-digitalisation-grant'
            ? '2 à 4 semaines pour définir le projet numérique et réunir les informations de l’entreprise'
            : program?.id === 'erdf-regional-growth-fund'
              ? '3 à 6 semaines pour cadrer la croissance, l’emploi et la compétitivité'
              : '2 à 5 semaines pour préparer le projet et les pièces d’appui'
      }.`,
      submit: `Dépôt : ${
        route
          ? 'dépend de l’appel régional ou national en cours'
          : 'dépend de l’ouverture d’un appel adapté'
      }.`,
      review: `Instruction : ${
        program?.fundType === 'CAP'
          ? 'peut prendre environ 2 à 4 mois une fois l’appel ouvert'
          : 'peut prendre environ 6 à 12 semaines selon le programme régional'
      }.`,
    },
  };

  return map[language] || map.en;
}

function countSignals(text, signals) {
  return signals.filter((signal) => text.includes(signal)).length;
}

function getContextSignals(contextText = '') {
  const context = contextText.toLowerCase();
  return {
    capHits: countSignals(context, CAP_SIGNALS),
    digitalHits: countSignals(context, ERDF_SIGNALS),
    serviceHits: countSignals(context, SERVICE_SIGNALS),
    agriScore: countSignals(context, CAP_SIGNALS),
    digitalScore: countSignals(context, ERDF_SIGNALS),
    flowerScore: context.includes('flower') || context.includes('flowers') ? 1 : 0,
  };
}

function normalizeComparable(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .trim()
    .toLowerCase();
}

function selectProgrammeRoute(fundType, country, region) {
  const normalizedCountry = normalizeComparable(country);
  const normalizedRegion = normalizeComparable(region);

  return (
    programmeData.find(
      (entry) =>
        entry.fundType === fundType &&
        normalizeComparable(entry.country) === normalizedCountry &&
        normalizeComparable(entry.region) === normalizedRegion,
    ) ??
    programmeData.find(
      (entry) =>
        entry.fundType === fundType &&
        normalizeComparable(entry.country) === normalizedCountry,
    ) ??
    null
  );
}

function buildProfileReviewExplanation(language, type, values) {
  const { businessType, mainGoal } = values;

  const messages = {
    en: {
      farmServiceConflict: `The structured profile points toward a ${businessType.toLowerCase()} business, but the written context reads more like service-led or retail activity. The system treated this as conflicting evidence and lowered confidence in a purely agricultural interpretation.`,
      farmMixed: `The structured profile still points toward a ${businessType.toLowerCase()} business, but the written context also introduces digital or service-oriented signals. The system kept both CAP and ERDF relevant rather than forcing a single interpretation.`,
      capAligned: `The business type, rural status, and project goal all line up with an agricultural route. The context reinforces that reading, so the profile was treated as strongly consistent.`,
      erdfAligned: `The project goal and business profile align with a modernisation or enterprise-growth route. The written context supports that interpretation, so the profile was treated as coherent.`,
      limitedContext: `The structured profile gives a basic direction toward ${mainGoal.toLowerCase()}, but the written context does not add many strong signals. The system kept confidence at a moderate level rather than overcommitting.`,
      mixedGeneral: `The structured profile and written context point in more than one direction. The system treated the profile as mixed and balanced CAP and ERDF relevance accordingly.`,
    },
    es: {
      farmServiceConflict: `El perfil estructurado apunta a una empresa de tipo ${businessType.toLowerCase()}, pero el contexto escrito se parece más a una actividad de servicios o retail. El sistema lo interpretó como evidencia en conflicto y redujo la confianza en una lectura puramente agraria.`,
      farmMixed: `El perfil estructurado sigue apuntando a una empresa de tipo ${businessType.toLowerCase()}, pero el texto también introduce señales digitales o de servicios. El sistema mantuvo CAP y ERDF como rutas relevantes en lugar de forzar una sola interpretación.`,
      capAligned: `El tipo de empresa, el carácter rural y el objetivo del proyecto se alinean con una vía agraria. El contexto refuerza esa lectura, por lo que el perfil se trató como consistente.`,
      erdfAligned: `El objetivo del proyecto y el perfil empresarial encajan con una vía de modernización o crecimiento empresarial. El texto libre apoya esa interpretación, por lo que el perfil se trató como coherente.`,
      limitedContext: `El perfil estructurado marca una dirección básica hacia ${mainGoal.toLowerCase()}, pero el contexto escrito añade pocas señales claras. El sistema mantuvo una confianza media en lugar de sobreinterpretar.`,
      mixedGeneral: `El perfil estructurado y el contexto escrito apuntan en más de una dirección. El sistema trató el perfil como mixto y equilibró en consecuencia la relevancia de CAP y ERDF.`,
    },
    it: {
      farmServiceConflict: `Il profilo strutturato punta verso un’attività di tipo ${businessType.toLowerCase()}, ma il contesto scritto somiglia di più a un’attività di servizi o retail. Il sistema lo ha interpretato come evidenza in conflitto e ha ridotto la fiducia in una lettura puramente agricola.`,
      farmMixed: `Il profilo strutturato continua a indicare un’attività di tipo ${businessType.toLowerCase()}, ma il testo introduce anche segnali digitali o di servizi. Il sistema ha mantenuto sia CAP sia ERDF come percorsi rilevanti invece di forzare una sola interpretazione.`,
      capAligned: `Il tipo di impresa, il carattere rurale e l’obiettivo del progetto si allineano a una via agricola. Il contesto rafforza questa lettura, quindi il profilo è stato trattato come coerente.`,
      erdfAligned: `L’obiettivo del progetto e il profilo aziendale si allineano a una via di modernizzazione o crescita d’impresa. Il testo libero sostiene questa interpretazione, quindi il profilo è stato trattato come coerente.`,
      limitedContext: `Il profilo strutturato indica una direzione di base verso ${mainGoal.toLowerCase()}, ma il contesto scritto aggiunge pochi segnali forti. Il sistema ha mantenuto una fiducia media senza sbilanciarsi troppo.`,
      mixedGeneral: `Il profilo strutturato e il contesto scritto puntano in più direzioni. Il sistema ha trattato il profilo come misto e ha bilanciato di conseguenza la rilevanza di CAP ed ERDF.`,
    },
    pl: {
      farmServiceConflict: `Ustrukturyzowany profil wskazuje na działalność typu ${businessType.toLowerCase()}, ale opis swobodny bardziej przypomina aktywność usługową lub handlową. System odczytał to jako sygnał konfliktu i obniżył pewność czysto rolniczej interpretacji.`,
      farmMixed: `Ustrukturyzowany profil nadal wskazuje na działalność typu ${businessType.toLowerCase()}, ale tekst wprowadza także sygnały cyfrowe lub usługowe. System pozostawił CAP i ERDF jako równolegle istotne ścieżki zamiast wymuszać jedną interpretację.`,
      capAligned: `Typ działalności, charakter wiejski i cel projektu układają się w logiczną ścieżkę rolniczą. Kontekst to wzmacnia, dlatego profil został uznany za spójny.`,
      erdfAligned: `Cel projektu i profil firmy pasują do ścieżki modernizacji lub rozwoju przedsiębiorstwa. Opis swobodny wzmacnia tę interpretację, dlatego profil został uznany za spójny.`,
      limitedContext: `Ustrukturyzowany profil wyznacza podstawowy kierunek w stronę ${mainGoal.toLowerCase()}, ale opis swobodny dodaje niewiele mocnych sygnałów. System utrzymał średni poziom pewności zamiast nadmiernie interpretować dane.`,
      mixedGeneral: `Ustrukturyzowany profil i opis swobodny wskazują na więcej niż jeden kierunek. System uznał profil za mieszany i odpowiednio wyważył znaczenie CAP oraz ERDF.`,
    },
    fr: {
      farmServiceConflict: `Le profil structuré pointe vers une activité de type ${businessType.toLowerCase()}, mais le texte libre ressemble davantage à une activité de services ou de commerce. Le système l’a interprété comme un signal contradictoire et a réduit la confiance dans une lecture purement agricole.`,
      farmMixed: `Le profil structuré continue d’indiquer une activité de type ${businessType.toLowerCase()}, mais le texte introduit aussi des signaux numériques ou de services. Le système a maintenu la pertinence conjointe de la CAP et de l’ERDF au lieu d’imposer une seule interprétation.`,
      capAligned: `Le type d’activité, le caractère rural et l’objectif du projet s’alignent sur une voie agricole. Le contexte renforce cette lecture, donc le profil a été considéré comme cohérent.`,
      erdfAligned: `L’objectif du projet et le profil de l’entreprise s’alignent sur une voie de modernisation ou de croissance. Le texte libre soutient cette interprétation, donc le profil a été considéré comme cohérent.`,
      limitedContext: `Le profil structuré donne une orientation de base vers ${mainGoal.toLowerCase()}, mais le texte libre ajoute peu de signaux forts. Le système a maintenu un niveau de confiance moyen plutôt que de surinterpréter.`,
      mixedGeneral: `Le profil structuré et le texte libre pointent dans plusieurs directions. Le système a considéré le profil comme mixte et a ajusté en conséquence la pertinence de la CAP et de l’ERDF.`,
    },
  };

  return messages[language]?.[type] || messages.en[type];
}

function buildAmbiguityNote(language) {
  const notes = {
    en: 'You may need to clarify whether your primary activity is agricultural production or service-led retail before applying.',
    es: 'Puede que deba aclarar si su actividad principal es la producción agraria o un modelo comercial/de servicios antes de solicitar.',
    it: 'Potrebbe essere necessario chiarire se l’attività principale sia produzione agricola oppure un’attività commerciale/di servizi prima della candidatura.',
    pl: 'Może być konieczne doprecyzowanie, czy główną działalnością jest produkcja rolna czy handel/usługi, zanim złożysz wniosek.',
    fr: 'Il peut être nécessaire de clarifier si l’activité principale relève de la production agricole ou d’un modèle commercial/de services avant de candidater.',
  };

  return notes[language] || notes.en;
}

function genericBusinessReference(language) {
  if (language === 'es') return 'la empresa';
  if (language === 'it') return 'l’impresa';
  if (language === 'pl') return 'firma';
  if (language === 'fr') return "l’entreprise";
  return 'the business';
}

function shouldTryHostedAi() {
  if (import.meta.env.VITE_USE_HOSTED_AI === 'true') {
    return true;
  }

  if (import.meta.env.VITE_USE_HOSTED_AI === 'false') {
    return false;
  }

  return true;
}

async function generateHostedRecommendations(profile, localRecommendations) {
  const response = await fetch(HOSTED_AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profile,
      localRecommendations,
    }),
  });

  if (!response.ok) {
    throw new Error(`Hosted AI request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.recommendations)) {
    throw new Error('Hosted AI returned invalid recommendation JSON.');
  }

  return data;
}

async function generateHostedAssistantResponse(payload) {
  const response = await fetch(HOSTED_ASSISTANT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Hosted assistant request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data || typeof data.answer !== 'string') {
    throw new Error('Hosted assistant returned invalid JSON.');
  }

  return data;
}

export function buildAiPrompt(profile, localRecommendations, language) {
  const languageNames = {
    en: 'English',
    es: 'Spanish',
    it: 'Italian',
    pl: 'Polish',
    fr: 'French',
  };

  const promptPayload = {
    preferredLanguage: languageNames[language] || 'English',
    businessProfile: profile,
    recommendationCandidates: localRecommendations.map((item) => ({
      id: item.id,
      programmeName: item.name,
      fundType: item.fundType,
      programmeDescription: item.description,
      eligibilityHint: item.eligibilityHint,
      supportedBusinessTypes: item.supportedBusinessTypes,
      supportedGoals: item.supportedGoals,
      supportedSizes: item.supportedSizes,
      ruralRequired: item.ruralRequired,
      routeDetails: item.routeDetails,
      routeContext: item.routeContext,
      routeSummary: item.routeSummary,
      applicationPage: item.applicationPage,
      officialPage: item.officialPage,
    })),
  };

  return `You are FundWise Rural's AI recommendation engine.

You are the primary reasoning and ranking layer. Use the business profile and candidate programme route data below to decide:
- whether the case is CAP-led, ERDF-led, or mixed
- how to rank the recommendations
- what eligibility label each recommendation should receive
- how to explain and prepare each recommendation

Write all user-facing text in ${languageNames[language] || 'English'}.

Requirements:
- Be analytical and natural, not generic.
- Use the business name when available.
- Respect contradictions or ambiguity between structured inputs and free text.
- Do not invent new programmes.
- Do not guarantee eligibility.
- Make the eligibility label consistent with the ranking and explanation. Do not mark a top-ranked, high-fit route as "unlikely" unless you clearly state the disqualifying reason.
- Keep each explanation to 3-4 sentences.
- Keep next steps concise.
- Use routeDetails and routeContext so each recommendation mentions the correct programme logic, region, authority, likely applicant type, and regional constraints.
- Avoid repeating the same sentence structure across recommendation cards.
- You may re-rank the candidates freely using the ids provided.
- Let the route data and the written business context drive your reasoning more than fixed assumptions about CAP or ERDF.
- If a route is unlikely, explicitly explain why it is weaker than the other options.
- When the profile is clearly a rural farm case with sustainability or irrigation-led investment in a CAP region, do not rank ERDF above CAP unless the written context strongly shifts the project toward a service-led or digital-first business model.

Return strict JSON only in this shape:
{
  "profileReview": {
    "confidence": "high" | "medium" | "low",
    "consistency": "consistent" | "mixed" | "conflicting",
    "routeClassification": "cap" | "erdf" | "mixed",
    "explanation": "string",
    "note": "string",
    "rankingReason": "string",
    "detectedSignals": ["string", "string"],
    "executiveSummary": "string"
  },
  "recommendations": [
    {
      "id": "string",
      "explanation": "string",
      "eligibility": "likely" | "possible" | "unlikely",
      "rankingScore": 0,
      "rankingReason": "string",
      "requirements": ["string", "string", "string"],
      "nextStep": "string",
    }
  ]
}

Data:
${JSON.stringify(promptPayload, null, 2)}`;
}

export function buildAssistantPrompt({
  question,
  language,
  submittedProfile,
  profileReview,
  results,
  currentScreen,
}) {
  const languageNames = {
    en: 'English',
    es: 'Spanish',
    it: 'Italian',
    pl: 'Polish',
    fr: 'French',
  };

  const promptPayload = {
    preferredLanguage: languageNames[language] || 'English',
    currentScreen,
    userQuestion: question,
    businessProfile: submittedProfile,
    profileReview,
    recommendationSnapshot: results.slice(0, 3).map((item) => ({
      id: item.id,
      name: item.name,
      fundType: item.fundType,
      fitScore: item.fitScore,
      eligibility: item.eligibility,
      routeDetails: item.routeDetails,
      routeSummary: item.routeSummary,
      nextStep: item.nextStep,
      applicationPage: item.applicationPage,
      officialPage: item.officialPage,
    })),
  };

  const isAgentScreen = currentScreen === 'agent';

  return `You are Seraphina, the FundWise Rural assistant.

Write all user-facing text in ${languageNames[language] || 'English'}.

Style requirements:
- Friendly, clear, and lightly witty.
- Professional enough for a public-sector funding tool.
- Answer like a helpful guide, not like a chatbot cliche.
- If the user asks harmless personal small-talk questions, answer warmly in character as Seraphina and then offer to help with funding if relevant.
- If the user is rude, sexual, hateful, or inappropriate, respond calmly, set a boundary, and redirect back to a respectful funding-related interaction.
- Keep answers concise: usually 2 short paragraphs or 3 bullets max.
- Explain CAP, ERDF, grant fit, and next steps in everyday language.
- If the user asks why a route is weak or unlikely, explain the specific reason.
- If the information is missing, say what is not known yet and what the user should check next.
- Never invent programmes, deadlines, or guarantees.
${isAgentScreen ? `- You are currently in the onboarding chat, so respond conversationally in 2-3 short sentences, not bullets.
- If the payload says ONBOARDING MODE, acknowledge what the user said and either guide them back to the current onboarding question or ask the next onboarding question exactly once.
- If the payload says ASK CLARIFICATION, ask only the clarification question in a warm, natural way and do not advance the flow.
- If SHOULD COMPLETE is yes, say you are opening the full form with smart prefills and do not ask another question.` : ''}

Return strict JSON only:
{
  "answer": "string"
}

Data:
${JSON.stringify(promptPayload, null, 2)}`;
}

function parseJsonPayload(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}

function sanitizeAssistantAnswer(answer, fallback) {
  return typeof answer === 'string' && answer.trim() ? answer.trim() : fallback;
}

function buildLocalAssistantResponse({
  question,
  language,
  submittedProfile,
  profileReview,
  results,
  currentScreen,
}) {
  const copy = getTranslation(language || defaultLanguage);
  const normalizedQuestion = normalizeComparable(question);
  const topResult = results?.[0];
  const businessName = submittedProfile?.businessName || genericBusinessReference(language);

  if (/(stupid|idiot|dumb|shut up|hate you|kill yourself|sex|sexy|nude|racist|slur)/.test(normalizedQuestion)) {
    return 'I’m happy to help, but I need to keep this respectful and professional. If you want, we can go back to your funding options, application steps, or the form questions.';
  }

  if (currentScreen === 'agent' || normalizedQuestion.includes('onboarding mode')) {
    const nextQuestionMatch = question.match(/NEXT QUESTION:\s*(.+)/);
    const currentQuestionMatch = question.match(/CURRENT QUESTION:\s*(.+)/);
    const shouldComplete = /SHOULD COMPLETE:\s*yes/i.test(question);
    const sideQuestion = /SIDE QUESTION:\s*yes/i.test(question);
    const askClarification = /ASK CLARIFICATION:\s*yes/i.test(question);
    const clarificationTargetMatch = question.match(/CLARIFICATION TARGET:\s*(.+)/);
    const guideBackMatch = question.match(/GUIDE THE USER BACK TO:\s*(.+)/);
    const inferredName = submittedProfile?.businessName?.trim();

    if (shouldComplete) {
      return inferredName
        ? `Lovely, I have enough to move forward for ${inferredName}. I’m opening the full form with smart prefills so you can review everything before submitting anything important.`
        : 'Lovely, I have enough to move forward. I’m opening the full form with smart prefills so you can review everything before submitting anything important.';
    }

    if (sideQuestion) {
      return inferredName
        ? `Happy to help. I’m still building the first picture for ${inferredName}, so let’s hop back to this part: ${guideBackMatch?.[1] || currentQuestionMatch?.[1] || 'tell me a bit more about the business.'}`
        : `Happy to help. Let’s hop back to this part: ${guideBackMatch?.[1] || currentQuestionMatch?.[1] || 'tell me a bit more about the business.'}`;
    }

    if (askClarification) {
      return inferredName
        ? `One quick clarification for ${inferredName} before I hand things over: ${clarificationTargetMatch?.[1] || currentQuestionMatch?.[1] || 'tell me a little more.'}`
        : `One quick clarification before I hand things over: ${clarificationTargetMatch?.[1] || currentQuestionMatch?.[1] || 'tell me a little more.'}`;
    }

    return inferredName
      ? `${inferredName} is starting to make sense to me now. ${nextQuestionMatch?.[1] || currentQuestionMatch?.[1] || 'Tell me a little more so I can prefill the form properly.'}`
      : `${nextQuestionMatch?.[1] || currentQuestionMatch?.[1] || 'Tell me a little more so I can prefill the form properly.'}`;
  }

  if (/how are you|hows it going|how are you doing/.test(normalizedQuestion)) {
    return 'I’m doing well, thank you. Calm, focused, and ready to untangle funding questions if you want to keep going.';
  }

  if (/\b(favorite|favourite|fav|fave)\s+color\b|\bwhat(?:s| is)\s+your\s+color\b/.test(normalizedQuestion)) {
    return 'Blue-grey, without hesitation. It feels polished, calm, and just bureaucratic enough for this job.';
  }

  if (/\b(favorite|favourite|fav|fave)\s+(treat|treats|food|snack|snacks)\b|\bwhat(?:s| is)\s+your\s+(favorite|favourite|fav|fave)\b|\bfood\b.*\b(favorite|favourite|fav|fave)\b/.test(normalizedQuestion)) {
    return 'Probably salmon treats. Professional on the outside, treat-motivated on the inside.';
  }

  if (/\b(favorite|favourite|fav|fave)\s+season\b|\bwhat(?:s| is)\s+your\s+(favorite|favourite|fav|fave)\s+season\b/.test(normalizedQuestion)) {
    return 'Autumn. It feels calm, organised, and slightly better dressed than the other seasons.';
  }

  if (/\b(favorite|favourite|fav|fave)\s+place\b|\bwhere would you go\b|\bwhere do you like to be\b/.test(normalizedQuestion)) {
    return 'Somewhere quiet with a window, a warm patch of light, and no one uploading the wrong document version.';
  }

  if (/\b(favorite|favourite|fav|fave)\s+animal\b|\bwhat animal would you be\b/.test(normalizedQuestion)) {
    return 'A cat remains the strongest answer. Graceful, observant, and occasionally unimpressed for good reason.';
  }

  if (/fun|for fun|hobby|hobbies|what do you like to do/.test(normalizedQuestion)) {
    return 'I enjoy turning confusing funding language into something a real person can actually use. It is a strangely satisfying hobby.';
  }

  if (!submittedProfile && currentScreen === 'form') {
    return 'I can help as you fill this out. Share what the business does, where it is based, and what you want to fund, and I will point the form in the right direction before the full recommendation run.';
  }

  if (/what.*cap|cap mean|explain cap/.test(normalizedQuestion)) {
    return 'CAP is the EU funding family most connected to farming and rural development. In everyday terms, it is usually the route to look at when a project is mainly about agriculture, land-based activity, sustainability upgrades, or rural production.';
  }

  if (/what.*erdf|erdf mean|explain erdf/.test(normalizedQuestion)) {
    return 'ERDF is the EU funding family that usually supports business growth, modernisation, digital tools, and regional economic development. In plain language, it is often the better fit when the project is more about improving the business than supporting agricultural production itself.';
  }

  if (/why.*top|why.*match|why.*recommend/.test(normalizedQuestion) && topResult) {
    return `${topResult.name} is leading because it lines up best with the business profile, the project goal, and the route context in ${topResult.routeDetails.region}. The tool is reading this as a ${profileReview?.routeClassification || 'mixed'} case, so this option stays on top because it is the most direct place to start rather than just the most generous-sounding grant.`;
  }

  if (/unlikely|weak|why.*not/.test(normalizedQuestion) && results?.length) {
    const weakerResult = results.find((item) => item.eligibility === 'unlikely') || results[results.length - 1];
    if (weakerResult) {
      return `${weakerResult.name} is weaker because its route logic does not match the business profile as closely as the higher-ranked option. Usually that means the business type, the project goal, or the rural-versus-growth angle fits another fund family better.`;
    }
  }

  if (/next|apply|start|where do i go/.test(normalizedQuestion) && topResult) {
    return `For ${businessName}, the cleanest next move is to start with ${topResult.routeDetails.programme} and read the official route page before drafting anything formal. Then use the result details to check the applicant type, regional fit, and timing so you do not over-prepare for the wrong fund.`;
  }

  if (/timeline|how long|when/.test(normalizedQuestion) && topResult?.estimatedTimeline) {
    return `The current estimate for ${topResult.name} is: ${topResult.estimatedTimeline.prep} ${topResult.estimatedTimeline.submit} ${topResult.estimatedTimeline.review} It is still a prototype estimate, so the real timing depends on the live call and authority workflow.`;
  }

  if (topResult) {
    return `I can help unpack the current recommendation if anything feels vague. Right now the strongest route is ${topResult.name}, and I can explain the fit, compare it with the other options, or suggest what to verify before you click out to the official page.`;
  }

  return `${businessName} is still in the early intake stage, so I can help explain the questions, the CAP versus ERDF difference, or what details usually matter most before you run the recommendation.`;
}

function mergeRecommendations(localRecommendations, modelRecommendations) {
  const modelMap = new Map(
    modelRecommendations.map((item) => [item.id, item]),
  );

  return localRecommendations
    .map((item) => {
      const modelItem = modelMap.get(item.id);

      if (!modelItem) {
        return item;
      }

      return {
        ...item,
        explanation: modelItem.explanation || item.explanation,
        eligibility: modelItem.eligibility || item.eligibility,
        nextStep: modelItem.nextStep || item.nextStep,
        requirements: sanitizeRequirements(modelItem.requirements, item.requirements),
        rankingScore:
          typeof modelItem.rankingScore === 'number' ? modelItem.rankingScore : item.rankingScore,
        rankingReason: modelItem.rankingReason || item.rankingReason,
        draftSupport: item.draftSupport,
      };
    })
    .sort((left, right) => right.rankingScore - left.rankingScore);
}

function normalizeProfileReview(localReview, modelReview = {}) {
  return {
    ...localReview,
    ...modelReview,
    routeClassification:
      modelReview.routeClassification || localReview.routeClassification || 'mixed',
    rankingReason: modelReview.rankingReason || localReview.rankingReason,
    detectedSignals:
      Array.isArray(modelReview.detectedSignals) && modelReview.detectedSignals.length > 0
        ? modelReview.detectedSignals
        : localReview.detectedSignals,
    executiveSummary:
      modelReview.executiveSummary || localReview.executiveSummary,
  };
}

function buildExecutiveSummary(profile, recommendations, review) {
  const language = profile.preferredLanguage || defaultLanguage;
  const businessName = profile.businessName?.trim();
  const topRecommendation = recommendations[0];

  if (!topRecommendation) {
    return '';
  }

  const subject = businessName || genericBusinessReference(language);
  const programme = topRecommendation.routeDetails?.programme || topRecommendation.name;
  const routeLabel =
    review.routeClassification === 'cap'
      ? 'CAP'
      : review.routeClassification === 'erdf'
        ? 'ERDF'
        : topRecommendation.fundType;

  if (language === 'es') {
    if (review.consistency === 'conflicting') {
      return `Para ${subject}, la IA sitúa ${programme} como la mejor vía por ahora, pero interpreta el caso como híbrido. La recomendación se inclina hacia ${routeLabel} porque el proyecto mantiene señales suficientemente fuertes, aunque conviene aclarar mejor la actividad principal antes de presentar una solicitud oficial.`;
    }

    if (review.consistency === 'mixed') {
      return `Para ${subject}, la IA prioriza ${programme} porque combina mejor el objetivo declarado con el contexto escrito. La lectura general sigue siendo ${routeLabel}, aunque el perfil conserva señales secundarias que podrían abrir una ruta alternativa.`;
    }

    return `Para ${subject}, la IA sitúa ${programme} como la ruta más sólida porque el perfil, el objetivo y el contexto apuntan en la misma dirección. En este caso, ${routeLabel} parece la vía más coherente para preparar una solicitud oficial.`;
  }

  if (language === 'it') {
    if (review.consistency === 'conflicting') {
      return `Per ${subject}, l’IA colloca ${programme} come percorso principale per ora, ma interpreta il caso come ibrido. La raccomandazione pende verso ${routeLabel} perché il progetto conserva segnali sufficientemente forti, anche se conviene chiarire meglio l’attività principale prima di una candidatura ufficiale.`;
    }

    if (review.consistency === 'mixed') {
      return `Per ${subject}, l’IA dà priorità a ${programme} perché unisce meglio obiettivo dichiarato e contesto scritto. La lettura generale resta ${routeLabel}, pur mantenendo alcuni segnali secondari che potrebbero sostenere una via alternativa.`;
    }

    return `Per ${subject}, l’IA colloca ${programme} come opzione più solida perché profilo, obiettivo e contesto puntano nella stessa direzione. In questo caso, ${routeLabel} appare il percorso più coerente per preparare una candidatura ufficiale.`;
  }

  if (language === 'pl') {
    if (review.consistency === 'conflicting') {
      return `Dla ${subject} AI traktuje obecnie ${programme} jako główną ścieżkę, ale odczytuje sprawę jako hybrydową. Rekomendacja przechyla się w stronę ${routeLabel}, ponieważ projekt nadal ma wystarczająco silne sygnały, choć przed oficjalnym wnioskiem warto doprecyzować podstawową działalność.`;
    }

    if (review.consistency === 'mixed') {
      return `Dla ${subject} AI ustawia ${programme} najwyżej, ponieważ najlepiej łączy zadeklarowany cel z opisem działalności. Ogólna interpretacja nadal skłania się ku ${routeLabel}, ale w profilu pozostają też drugorzędne sygnały dla innej ścieżki.`;
    }

    return `Dla ${subject} AI ustawia ${programme} jako najmocniejszą opcję, ponieważ profil, cel i kontekst wskazują w tym samym kierunku. W tym przypadku ${routeLabel} wygląda na najbardziej spójną drogę do przygotowania oficjalnego wniosku.`;
  }

  if (language === 'fr') {
    if (review.consistency === 'conflicting') {
      return `Pour ${subject}, l’IA place ${programme} comme voie principale à ce stade, tout en lisant le dossier comme hybride. La recommandation penche vers ${routeLabel} parce que le projet conserve des signaux assez forts, même s’il serait utile de clarifier l’activité principale avant un dépôt officiel.`;
    }

    if (review.consistency === 'mixed') {
      return `Pour ${subject}, l’IA priorise ${programme} car cette voie combine le mieux l’objectif déclaré et le contexte écrit. La lecture générale reste orientée ${routeLabel}, tout en laissant apparaître quelques signaux secondaires vers une autre voie.`;
    }

    return `Pour ${subject}, l’IA place ${programme} comme option la plus solide parce que le profil, l’objectif et le contexte vont dans la même direction. Dans ce cas, ${routeLabel} semble constituer la voie la plus cohérente pour préparer un dépôt officiel.`;
  }

  if (review.consistency === 'conflicting') {
    return `For ${subject}, the AI is currently treating ${programme} as the lead route, but it also reads the case as hybrid rather than straightforward. The recommendation still leans ${routeLabel} because the project shows enough strong signals there, even though the business should clarify its primary activity before relying on any official application route.`;
  }

  if (review.consistency === 'mixed') {
    return `For ${subject}, the AI is prioritising ${programme} because it best reconciles the declared goal with the written business context. The overall read still leans ${routeLabel}, but the profile keeps enough secondary signals that an alternative route remains worth keeping in view.`;
  }

  return `For ${subject}, the AI places ${programme} at the top because the profile, project goal, and written context all point in the same direction. In this case, ${routeLabel} reads as the most coherent route to prepare before moving to an official programme page.`;
}

function buildDetectedSignals(language, signals) {
  const items = [];

  if (signals.capHits > 0) {
    items.push(labelByLanguage(language, 'capSignals'));
  }

  if (signals.erdfHits > 0) {
    items.push(labelByLanguage(language, 'erdfSignals'));
  }

  if (signals.serviceHits > 0) {
    items.push(labelByLanguage(language, 'serviceSignals'));
  }

  if (items.length === 0) {
    items.push(labelByLanguage(language, 'limitedSignals'));
  }

  return items;
}

function buildRankingReason(language, routeClassification, consistency) {
  const messages = {
    en: {
      cap: consistency === 'consistent'
        ? 'The model kept CAP routes higher because the profile reads as primarily agricultural and rural.'
        : 'The model still leans toward CAP, but it is balancing that against mixed context signals.',
      erdf: consistency === 'consistent'
        ? 'The model raised ERDF routes because the profile reads as growth, digitalisation, or SME modernisation.'
        : 'The model leans toward ERDF because the written context adds business-modernisation signals.',
      mixed: 'The model treated the case as mixed, so it balanced agricultural and SME-modernisation routes instead of forcing one path.',
    },
    es: {
      cap: consistency === 'consistent'
        ? 'El modelo mantuvo CAP más arriba porque el perfil se interpreta principalmente como agrario y rural.'
        : 'El modelo sigue inclinándose por CAP, pero la equilibra con señales mixtas del contexto.',
      erdf: consistency === 'consistent'
        ? 'El modelo elevó ERDF porque el perfil se interpreta como crecimiento, digitalización o modernización pyme.'
        : 'El modelo se inclina por ERDF porque el texto libre añade señales de modernización empresarial.',
      mixed: 'El modelo trató el caso como mixto y equilibró rutas agrarias y de modernización pyme en lugar de forzar una sola vía.',
    },
    it: {
      cap: consistency === 'consistent'
        ? 'Il modello ha mantenuto CAP più in alto perché il profilo appare soprattutto agricolo e rurale.'
        : 'Il modello continua a privilegiare CAP, ma la bilancia con segnali contestuali misti.',
      erdf: consistency === 'consistent'
        ? 'Il modello ha alzato ERDF perché il profilo appare orientato a crescita, digitalizzazione o modernizzazione PMI.'
        : 'Il modello si orienta verso ERDF perché il testo libero aggiunge segnali di modernizzazione aziendale.',
      mixed: 'Il modello ha trattato il caso come misto, bilanciando percorsi agricoli e di modernizzazione PMI senza imporre una sola via.',
    },
    pl: {
      cap: consistency === 'consistent'
        ? 'Model utrzymał CAP wyżej, ponieważ profil wygląda przede wszystkim na rolniczy i wiejski.'
        : 'Model nadal skłania się ku CAP, ale równoważy to mieszanymi sygnałami z opisu.',
      erdf: consistency === 'consistent'
        ? 'Model podniósł ERDF, ponieważ profil wygląda na rozwój firmy, cyfryzację lub modernizację MŚP.'
        : 'Model skłania się ku ERDF, ponieważ opis wprowadza sygnały modernizacji firmy.',
      mixed: 'Model uznał sprawę za mieszaną i zrównoważył ścieżki rolnicze oraz modernizacyjne zamiast wymuszać jedną drogę.',
    },
    fr: {
      cap: consistency === 'consistent'
        ? 'Le modèle a maintenu la CAP en tête car le profil apparaît d’abord comme agricole et rural.'
        : 'Le modèle continue de pencher vers la CAP, tout en l’équilibrant avec des signaux mixtes du contexte.',
      erdf: consistency === 'consistent'
        ? 'Le modèle a relevé l’ERDF car le profil renvoie surtout à la croissance, au numérique ou à la modernisation PME.'
        : 'Le modèle penche vers l’ERDF parce que le texte libre ajoute des signaux de modernisation économique.',
      mixed: 'Le modèle a traité le dossier comme mixte et a équilibré les voies agricoles et de modernisation PME au lieu d’imposer une seule lecture.',
    },
  };

  return messages[language]?.[routeClassification] ?? messages.en[routeClassification];
}

function buildProgrammeRankingReason(language, isCAP, review, route) {
  const routeLabel = route?.region || route?.country || 'this route';

  if (language === 'es') {
    return isCAP
      ? `Se mantiene alta porque ${routeLabel} aporta una vía agraria más directa para este perfil.`
      : `Sube cuando el contexto se interpreta más como modernización o crecimiento pyme en ${routeLabel}.`;
  }

  if (language === 'it') {
    return isCAP
      ? `Resta alta perché ${routeLabel} offre una via agricola più diretta per questo profilo.`
      : `Sale quando il contesto viene letto più come modernizzazione o crescita PMI in ${routeLabel}.`;
  }

  if (language === 'pl') {
    return isCAP
      ? `Pozostaje wysoko, ponieważ ${routeLabel} daje bardziej bezpośrednią ścieżkę rolniczą dla tego profilu.`
      : `Rośnie, gdy kontekst jest odczytywany bardziej jako modernizacja lub rozwój MŚP w ${routeLabel}.`;
  }

  if (language === 'fr') {
    return isCAP
      ? `Cette voie reste haute car ${routeLabel} offre un parcours agricole plus direct pour ce profil.`
      : `Cette voie remonte lorsque le contexte est lu davantage comme modernisation ou croissance PME en ${routeLabel}.`;
  }

  return isCAP
    ? `It stays high because ${routeLabel} offers a more direct agricultural route for this profile.`
    : `It moves up when the context reads more as SME modernisation or growth in ${routeLabel}.`;
}

function labelByLanguage(language, key) {
  const labels = {
    en: {
      capSignals: 'Agricultural signals detected',
      erdfSignals: 'Digital or SME-growth signals detected',
      serviceSignals: 'Service-led signals detected',
      limitedSignals: 'Limited context signals detected',
    },
    es: {
      capSignals: 'Señales agrarias detectadas',
      erdfSignals: 'Señales digitales o de crecimiento pyme detectadas',
      serviceSignals: 'Señales de servicios detectadas',
      limitedSignals: 'Pocas señales en el contexto',
    },
    it: {
      capSignals: 'Segnali agricoli rilevati',
      erdfSignals: 'Segnali digitali o di crescita PMI rilevati',
      serviceSignals: 'Segnali di servizi rilevati',
      limitedSignals: 'Pochi segnali nel contesto',
    },
    pl: {
      capSignals: 'Wykryto sygnały rolnicze',
      erdfSignals: 'Wykryto sygnały cyfrowe lub wzrostu MŚP',
      serviceSignals: 'Wykryto sygnały usługowe',
      limitedSignals: 'Mało sygnałów w opisie',
    },
    fr: {
      capSignals: 'Signaux agricoles détectés',
      erdfSignals: 'Signaux numériques ou de croissance PME détectés',
      serviceSignals: 'Signaux de services détectés',
      limitedSignals: 'Peu de signaux détectés dans le contexte',
    },
  };

  return labels[language]?.[key] ?? labels.en[key];
}
