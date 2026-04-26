import { useEffect, useMemo, useRef, useState } from 'react';
import { askFundwiseAssistant } from '../aiHelper';
import { countryOptions, defaultLanguage, getTranslation, languageOptions, regionsByCountry } from '../i18n/translations';
import SeraphinaAvatar from './SeraphinaAvatar';

const agentQuestionSets = {
  en: [
    'What is your business called, and what kind of work do you do?',
    'Where is the business based, and is it mainly rural or not?',
    'Roughly how big is the business, how long have you been operating, and do any tags fit like women-owned, youth-owned, cooperative, sustainable, or innovative?',
    'What are you hoping to fund or improve right now, and do you want just regional grants or general grants too?',
  ],
  es: [
    '¿Cómo se llama su empresa y a qué se dedica?',
    '¿Dónde está ubicada la empresa y es principalmente rural o no?',
    '¿Qué tamaño tiene aproximadamente la empresa, cuánto tiempo lleva operando y encaja alguna etiqueta como propiedad de mujeres, de jóvenes, cooperativa, sostenible o innovadora?',
    '¿Qué espera financiar o mejorar ahora mismo y quiere solo subvenciones regionales o también generales?',
  ],
  it: [
    'Come si chiama la sua impresa e di cosa si occupa?',
    'Dove ha sede l’impresa ed è principalmente in area rurale oppure no?',
    'Quanto è grande circa l’impresa, da quanto tempo opera e si adatta qualche tag come a conduzione femminile, giovanile, cooperativa, sostenibile o innovativa?',
    'Che cosa spera di finanziare o migliorare adesso e vuole solo bandi regionali o anche generali?',
  ],
  pl: [
    'Jak nazywa się firma i czym się zajmuje?',
    'Gdzie firma ma siedzibę i czy działa głównie na obszarze wiejskim czy nie?',
    'Jakiej wielkości jest mniej więcej firma, jak długo działa i czy pasują do niej oznaczenia, takie jak prowadzona przez kobiety, młodych, spółdzielnia, zrównoważona lub innowacyjna?',
    'Co chcecie teraz sfinansować lub ulepszyć i czy interesują was tylko dotacje regionalne, czy także ogólne?',
  ],
  fr: [
    'Comment s’appelle votre entreprise et quel type d’activité exerce-t-elle ?',
    'Où l’entreprise est-elle basée et est-elle principalement rurale ou non ?',
    'Quelle est approximativement la taille de l’entreprise, depuis combien de temps existe-t-elle et des étiquettes comme dirigée par des femmes, par des jeunes, coopérative, durable ou innovante s’appliquent-elles ?',
    'Que souhaitez-vous financer ou améliorer maintenant, et voulez-vous seulement des aides régionales ou aussi des aides plus générales ?',
  ],
};

const agentUiCopy = {
  en: {
    guideEyebrow: 'AI Guide',
    title: 'Meet Seraphina',
    intro:
      'Seraphina will ask a few quick questions to understand your business, then help you start the full form with some details already filled in.',
    languageLabel: 'Preferred language',
    replyPlaceholder: 'Type your reply here...',
    replyTyping: 'Seraphina is replying…',
    replyHint: 'Press Enter to send, or Shift+Enter for a new line.',
    send: 'Send',
    thinking: 'Thinking…',
    openingForm: 'Opening form…',
    skip: 'Skip to full form',
    prefillNote:
      'The AI guide prefilled a few fields for you. Review and adjust anything before running the full recommendation flow.',
  },
  es: {
    guideEyebrow: 'Guía con IA',
    title: 'Conozca a Seraphina',
    intro:
      'Seraphina hará unas preguntas rápidas para entender su empresa y luego le ayudará a iniciar el formulario completo con algunos datos ya rellenados.',
    languageLabel: 'Idioma preferido',
    replyPlaceholder: 'Escriba su respuesta aquí...',
    replyTyping: 'Seraphina está respondiendo…',
    replyHint: 'Pulse Enter para enviar o Shift+Enter para una nueva línea.',
    send: 'Enviar',
    thinking: 'Pensando…',
    openingForm: 'Abriendo formulario…',
    skip: 'Ir al formulario completo',
    prefillNote:
      'La guía de IA ha rellenado algunos campos por usted. Revise y ajuste lo necesario antes de ejecutar la recomendación completa.',
  },
  it: {
    guideEyebrow: 'Guida IA',
    title: 'Conosca Seraphina',
    intro:
      'Seraphina le farà alcune domande rapide per capire la sua impresa e poi la aiuterà ad avviare il modulo completo con alcuni dati già compilati.',
    languageLabel: 'Lingua preferita',
    replyPlaceholder: 'Scriva qui la sua risposta...',
    replyTyping: 'Seraphina sta rispondendo…',
    replyHint: 'Premi Invio per inviare oppure Maiusc+Invio per andare a capo.',
    send: 'Invia',
    thinking: 'Sto pensando…',
    openingForm: 'Apro il modulo…',
    skip: 'Vai al modulo completo',
    prefillNote:
      'La guida IA ha precompilato alcuni campi per lei. Controlli e modifichi ciò che serve prima di avviare la raccomandazione completa.',
  },
  pl: {
    guideEyebrow: 'Przewodnik AI',
    title: 'Poznaj Seraphinę',
    intro:
      'Seraphina zada kilka szybkich pytań, aby zrozumieć Twoją firmę, a potem pomoże rozpocząć pełny formularz z częścią pól już uzupełnionych.',
    languageLabel: 'Preferowany język',
    replyPlaceholder: 'Wpisz odpowiedź tutaj...',
    replyTyping: 'Seraphina odpowiada…',
    replyHint: 'Naciśnij Enter, aby wysłać, lub Shift+Enter, aby przejść do nowej linii.',
    send: 'Wyślij',
    thinking: 'Myślę…',
    openingForm: 'Otwieram formularz…',
    skip: 'Przejdź do pełnego formularza',
    prefillNote:
      'Przewodnik AI uzupełnił już kilka pól. Sprawdź je i popraw, jeśli trzeba, zanim uruchomisz pełne rekomendacje.',
  },
  fr: {
    guideEyebrow: 'Guide IA',
    title: 'Rencontrez Seraphina',
    intro:
      'Seraphina vous posera quelques questions rapides pour comprendre votre entreprise, puis vous aidera à ouvrir le formulaire complet avec certains champs déjà préremplis.',
    languageLabel: 'Langue préférée',
    replyPlaceholder: 'Saisissez votre réponse ici...',
    replyTyping: 'Seraphina répond…',
    replyHint: 'Appuyez sur Entrée pour envoyer, ou sur Maj+Entrée pour aller à la ligne.',
    send: 'Envoyer',
    thinking: 'Réflexion…',
    openingForm: 'Ouverture du formulaire…',
    skip: 'Passer au formulaire complet',
    prefillNote:
      'Le guide IA a prérempli quelques champs pour vous. Vérifiez-les et ajustez-les avant de lancer la recommandation complète.',
  },
};

const initialDraft = {
  preferredLanguage: defaultLanguage,
  businessName: '',
  country: '',
  region: '',
  businessType: '',
  agricultureSubType: '',
  businessSize: '',
  yearsInOperation: '',
  mainGoal: '',
  otherMainGoal: '',
  ruralArea: '',
  additionalContext: '',
  specialTags: [],
  grantScopePreference: '',
};

function TypingDots() {
  return (
    <span className="typing-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
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

function inferBusinessType(text) {
  const normalized = normalizeComparable(text);

  if (/(farm|farmer|agricultural|crop|greenhouse|horticulture|livestock)/.test(normalized)) {
    return 'farm';
  }
  if (/(agri.?tourism|farm stay|guesthouse|rural tourism)/.test(normalized)) {
    return 'agriTourism';
  }
  if (/(food producer|bakery|brewery|food business|processing)/.test(normalized)) {
    return 'foodProducer';
  }
  if (/(manufacturer|manufacturing|factory|production line)/.test(normalized)) {
    return 'manufacturer';
  }
  if (/(retail|shop|store|boutique|ecommerce)/.test(normalized)) {
    return 'retail';
  }
  if (/(studio|design|consulting|service|hospitality|tourism|agency)/.test(normalized)) {
    return 'service';
  }

  return '';
}

function inferBusinessName(text) {
  const quoted = text.match(/["“](.+?)["”]/);

  if (quoted?.[1]) {
    return quoted[1].trim();
  }

  const namedPattern = text.match(/(?:business|company|studio|farm|shop|brand)\s+(?:is|called|named)\s+([^,.!\n]{2,60})/i);
  if (namedPattern?.[1]) {
    return cleanBusinessName(namedPattern[1]);
  }

  const weArePattern = text.match(/(?:we are|i run|i own|my business is|i manage|our business is|this is)\s+([^,.!\n]{2,80})/i);
  if (weArePattern?.[1]) {
    return cleanBusinessName(weArePattern[1]);
  }

  const callPattern = text.match(/(?:called|named)\s+([^,.!\n]{2,60})/i);
  if (callPattern?.[1]) {
    return cleanBusinessName(callPattern[1]);
  }

  const leading = text.match(/^([A-Z][A-Za-z0-9&'\-]+(?:\s+[A-Z][A-Za-z0-9&'\-]+){0,4})/);
  return cleanBusinessName(leading?.[1] || '');
}

function cleanBusinessName(value = '') {
  return value
    .replace(/^(is|called|named)\s+/i, '')
    .replace(/^(a|an|the)\s+/i, '')
    .replace(/^(our|my)\s+/i, '')
    .replace(/\b(and|that|which)\b.*$/i, '')
    .replace(/\b(a|an|the)\s+(farm|business|company|studio|shop)\b.*$/i, '')
    .replace(/\b(in|based in|located in)\b.*$/i, '')
    .replace(/[.,:;!?]+$/g, '')
    .trim();
}

function appendContext(currentValue, addition) {
  const cleaned = addition?.trim().replace(/\s+/g, ' ');

  if (!cleaned) {
    return currentValue || '';
  }

  if (!currentValue) {
    return cleaned.endsWith('.') ? cleaned : `${cleaned}.`;
  }

  return `${currentValue.trim()} ${cleaned.endsWith('.') ? cleaned : `${cleaned}.`}`;
}

function inferGoal(text, { allowOther = false } = {}) {
  const normalized = normalizeComparable(text);
  const scoreCard = {
    digitize: 0,
    sustainabilityUpgrade: 0,
    buyEquipment: 0,
    expandOperations: 0,
    hireStaff: 0,
  };

  const score = (key, pattern, amount = 1) => {
    if (pattern.test(normalized)) {
      scoreCard[key] += amount;
    }
  };

  score('digitize', /(digit|website|booking|software|ecommerce|online|platform|crm|system|automation|digital|app)/, 2);
  score('sustainabilityUpgrade', /(sustain|green|energy|water|irrigation|efficiency|solar|waste|carbon|environment|resilience)/, 2);
  score('buyEquipment', /(equipment|machine|tractor|tool|purchase|buy|upgrade machinery|hardware|vehicle|packaging line|pump)/, 2);
  score('expandOperations', /(expand|growth|larger|new location|scale|capacity|more customers|reach new markets|increase production|grow the business)/, 2);
  score('hireStaff', /(hire|staff|employees|team|recruit|workforce|new roles|training staff)/, 2);

  const bestMatch = Object.entries(scoreCard).sort((a, b) => b[1] - a[1])[0];
  if (bestMatch?.[1] > 0) {
    return bestMatch[0];
  }

  return allowOther ? 'other' : '';
}

function inferAgricultureSubType(text) {
  const normalized = normalizeComparable(text);

  if (/(flower|floral|horticulture|nursery)/.test(normalized)) return 'flowersHorticulture';
  if (/(field crop|grain|wheat|corn|olive|vineyard)/.test(normalized)) return 'fieldCrops';
  if (/(livestock|cattle|sheep|goat|dairy|poultry)/.test(normalized)) return 'livestock';
  if (/(greenhouse|glasshouse|controlled growing)/.test(normalized)) return 'greenhouse';
  if (/(irrigation|water system|drip)/.test(normalized)) return 'irrigationWater';
  if (/(mixed farm|mixed agriculture)/.test(normalized)) return 'mixedAgriculture';

  return '';
}

function inferCountryAndRegion(text) {
  const normalized = normalizeComparable(text);
  let country = '';
  let region = '';

  for (const option of countryOptions) {
    if (normalized.includes(option.value) || normalized.includes(normalizeComparable(option.labelKey))) {
      country = option.value;
      break;
    }
  }

  for (const [countryKey, regions] of Object.entries(regionsByCountry)) {
    const matchedRegion = regions.find((entry) =>
      normalized.includes(normalizeComparable(entry.label)) ||
      normalized.includes(normalizeComparable(entry.value)),
    );

    if (matchedRegion) {
      region = matchedRegion.value;
      country = country || countryKey;
      break;
    }
  }

  return { country, region };
}

function inferGrantScope(text) {
  const normalized = normalizeComparable(text);

  if (/(regional only|just regional|only regional|local and regional)/.test(normalized)) {
    return 'regionalOnly';
  }

  if (/(general too|both|all grants|general grants|regional and general)/.test(normalized)) {
    return 'regionalAndGeneral';
  }

  return '';
}

function inferRuralArea(text) {
  const normalized = normalizeComparable(text);

  if (/(rural|village|countryside|farm area|remote)/.test(normalized)) return 'yes';
  if (/(urban|city|metropolitan|not rural)/.test(normalized)) return 'no';

  return '';
}

function inferBusinessSize(text) {
  const normalized = normalizeComparable(text);
  const headcountMatch = normalized.match(/(\d+)\s*(?:employees|employee|staff|workers|people|person team|team members)/);

  if (headcountMatch) {
    const count = Number(headcountMatch[1]);
    if (Number.isFinite(count)) {
      if (count < 10) return 'micro';
      if (count < 50) return 'small';
      if (count < 250) return 'medium';
      if (count < 3000) return 'midCap';
      return 'large';
    }
  }

  if (/(micro|solo|just me|1 employee|2 employees|3 employees|4 employees|5 employees|under 10)/.test(normalized)) {
    return 'micro';
  }

  if (/(small|10 employees|20 employees|30 employees|40 employees|under 50)/.test(normalized)) {
    return 'small';
  }

  if (/(medium|50 employees|100 employees|200 employees|under 250)/.test(normalized)) {
    return 'medium';
  }

  if (/(mid cap|mid-cap|midcap|250 employees|300 employees|500 employees|1000 employees|2000 employees|under 3000)/.test(normalized)) {
    return 'midCap';
  }

  if (/(large|large business|large company|enterprise scale|3000 employees|5000 employees|10000 employees|corporate)/.test(normalized)) {
    return 'large';
  }

  return '';
}

function inferYearsInOperation(text) {
  const normalized = normalizeComparable(text);
  const yearNumberMatch = normalized.match(/(\d+)\s*(?:years?|yrs?)/);
  const monthsMatch = normalized.match(/(\d+)\s*(?:months?|mos?)/);
  const openedYearMatch = normalized.match(/(?:since|opened in|started in|operating since)\s*(20\d{2}|19\d{2})/);

  if (yearNumberMatch) {
    const years = Number(yearNumberMatch[1]);
    if (Number.isFinite(years)) {
      if (years <= 1) return '0-1';
      if (years <= 5) return '2-5';
      return '6+';
    }
  }

  if (monthsMatch) {
    const months = Number(monthsMatch[1]);
    if (Number.isFinite(months) && months < 12) {
      return '0-1';
    }
  }

  if (openedYearMatch) {
    const currentYear = new Date().getFullYear();
    const openedYear = Number(openedYearMatch[1]);
    const years = currentYear - openedYear;
    if (Number.isFinite(years) && years >= 0) {
      if (years <= 1) return '0-1';
      if (years <= 5) return '2-5';
      return '6+';
    }
  }

  if (/(new|startup|started this year|less than 1 year|under 1 year|0-1)/.test(normalized)) {
    return '0-1';
  }

  if (/(2 years|3 years|4 years|5 years|2-5|few years)/.test(normalized)) {
    return '2-5';
  }

  if (/(6 years|7 years|8 years|10 years|over 5|6\+|established)/.test(normalized)) {
    return '6+';
  }

  return '';
}

function getNarrativeSizeLabel(size) {
  const labels = {
    micro: 'micro business',
    small: 'small business',
    medium: 'medium-sized business',
    midCap: 'mid-cap business',
    large: 'large enterprise',
  };

  return labels[size] || '';
}

function inferSpecialTags(text) {
  const normalized = normalizeComparable(text);
  const tags = [];

  if (/(women owned|woman owned|female founded|female led|women led)/.test(normalized)) tags.push('womenOwned');
  if (/(youth owned|young founder|young entrepreneur|under 30)/.test(normalized)) tags.push('youthOwned');
  if (/(cooperative|co-op|coop)/.test(normalized)) tags.push('cooperative');
  if (/(sustainable|green|eco|environmental)/.test(normalized)) tags.push('sustainable');
  if (/(innovative|innovation|new technology|novel)/.test(normalized)) tags.push('innovative');

  return tags;
}

function extractProfileSignals(text, questionIndex) {
  const location = inferCountryAndRegion(text);
  const inferredGoal =
    questionIndex === 3
      ? inferGoal(text, { allowOther: true })
      : inferGoal(text, { allowOther: false });

  return {
    businessType: inferBusinessType(text),
    businessName: inferBusinessName(text),
    agricultureSubType: inferAgricultureSubType(text),
    country: location.country,
    region: location.region,
    ruralArea: inferRuralArea(text),
    businessSize: inferBusinessSize(text),
    yearsInOperation: inferYearsInOperation(text),
    mainGoal: inferredGoal,
    otherMainGoal: inferredGoal === 'other' ? text.trim() : '',
    grantScopePreference: inferGrantScope(text),
    specialTags: inferSpecialTags(text),
  };
}

function answerLooksLikeProfileContent(text, questionIndex) {
  const normalized = normalizeComparable(text);

  if (!normalized) {
    return false;
  }

  const signals = extractProfileSignals(text, questionIndex);
  const generalSignals = [
    signals.businessType,
    signals.businessName,
    signals.country,
    signals.region,
    signals.ruralArea,
    signals.businessSize,
    signals.yearsInOperation,
    signals.mainGoal,
    signals.grantScopePreference,
    ...signals.specialTags,
  ].filter(Boolean);

  if (generalSignals.length > 0) {
    return true;
  }

  if (questionIndex === 0 && /(we|i|our|my)\s/.test(normalized)) {
    return true;
  }

  if (questionIndex === 1 && /(in|based|located|from)\s/.test(normalized)) {
    return true;
  }

  if (questionIndex === 2 && /(\d+|micro|small|medium|mid.?cap|large|years?|owned|innovative|sustainable|cooperative)/.test(normalized)) {
    return true;
  }

  if (questionIndex === 3 && /(want|need|looking|hoping|fund|improve|upgrade|expand|digital|equipment|regional|general)/.test(normalized)) {
    return true;
  }

  return false;
}

function buildRefinedBusinessContext(draft, answers, copy) {
  const sentences = [];
  const businessName = draft.businessName?.trim();
  const businessTypeLabel = copy.businessTypes?.[draft.businessType] || draft.businessType || 'business';
  const agricultureLabel = copy.agricultureSubTypes?.[draft.agricultureSubType] || '';
  const sizeLabel = getNarrativeSizeLabel(draft.businessSize);
  const countryLabel = copy.countries?.[draft.country] || draft.country || '';
  const regionLabel =
    regionsByCountry[draft.country || '']?.find((entry) => entry.value === draft.region)?.label || draft.region || '';
  const goalLabel =
    draft.mainGoal === 'other'
      ? draft.otherMainGoal?.trim()
      : copy.goals?.[draft.mainGoal] || draft.otherMainGoal?.trim() || '';
  const tagLabels = (draft.specialTags || []).map((tag) => copy.tags?.[tag]).filter(Boolean);
  const answersText = answers.join(' ').replace(/\s+/g, ' ').trim();

  if (businessName || businessTypeLabel) {
    const subject = businessName || 'The business';
    const typePhrase = agricultureLabel ? `${businessTypeLabel} focused on ${agricultureLabel}` : businessTypeLabel;
    sentences.push(
      sizeLabel
        ? `${subject} is a ${sizeLabel} operating as a ${typePhrase}.`.replace(/\s+/g, ' ').trim()
        : `${subject} is a ${typePhrase}.`.replace(/\s+/g, ' ').trim(),
    );
  }

  if (countryLabel || regionLabel || draft.ruralArea) {
    const locationBits = [];
    if (regionLabel) locationBits.push(regionLabel);
    if (countryLabel) locationBits.push(countryLabel);
    const ruralPhrase =
      draft.ruralArea === 'yes'
        ? 'It operates in a rural setting.'
        : draft.ruralArea === 'no'
          ? 'It is not primarily based in a rural setting.'
          : '';

    if (locationBits.length > 0) {
      sentences.push(`The business is based in ${locationBits.join(', ')}.`);
    }

    if (ruralPhrase) {
      sentences.push(ruralPhrase);
    }
  }

  if (draft.yearsInOperation) {
    const yearsPhrase =
      draft.yearsInOperation === '0-1'
        ? 'It is a relatively new business.'
        : draft.yearsInOperation === '2-5'
          ? 'It has been operating for a few years.'
          : 'It is an established business with several years of activity.';
    sentences.push(yearsPhrase);
  }

  if (goalLabel) {
    const scopePhrase =
      draft.grantScopePreference === 'regionalOnly'
        ? 'The user wants to focus on regional routes.'
        : draft.grantScopePreference === 'regionalAndGeneral'
          ? 'The user is open to both regional and broader EU-wide opportunities.'
          : '';
    sentences.push(`The current funding priority is ${goalLabel}.`);
    if (scopePhrase) {
      sentences.push(scopePhrase);
    }
  }

  if (tagLabels.length > 0) {
    sentences.push(`Relevant profile qualifiers include ${tagLabels.join(', ')}.`);
  }

  if (answersText) {
    const lowercaseAnswers = answersText.toLowerCase();
    if (/(irrigation|water system|drip)/.test(lowercaseAnswers) && !sentences.join(' ').toLowerCase().includes('irrigation')) {
      sentences.push('The user mentioned irrigation or water-system improvements as part of the project.');
    }
    if (/(website|booking|software|digital|ecommerce|online)/.test(lowercaseAnswers) && !sentences.join(' ').toLowerCase().includes('digital')) {
      sentences.push('The project may also include a digital or online-improvement component.');
    }
  }

  return Array.from(new Set(sentences.map((sentence) => sentence.trim()).filter(Boolean))).join(' ');
}

function getClarificationPrompt(questionIndex, draft) {
  if (questionIndex === 0 && (!draft.businessName || !draft.businessType)) {
    return 'I want to make sure I capture the business correctly. What is the business called, and is it closer to a farm, rural tourism, food production, retail, manufacturing, or a service business?';
  }

  if (questionIndex === 1 && !draft.country && !draft.region) {
    return 'I still need the location pinned down. Which country and region is the business based in, and is the activity mainly rural or not?';
  }

  if (questionIndex === 2 && !draft.businessSize && !draft.yearsInOperation && draft.specialTags.length === 0) {
    return 'I still need a rough sense of scale. Is the business micro, small, medium, mid-cap, or large, how long has it been operating, and do any profile tags fit?';
  }

  if (questionIndex === 3 && !draft.mainGoal && !draft.otherMainGoal) {
    return 'Before I hand this over, what is the main thing you want funding for right now?';
  }

  return '';
}

function buildSummaryParts(draft, copy) {
  const parts = [];

  if (draft.businessType) {
    parts.push(copy.businessTypes?.[draft.businessType] || draft.businessType);
  }
  if (draft.country) {
    parts.push(copy.countries?.[draft.country] || draft.country);
  }
  if (draft.region) {
    const regionLabel =
      regionsByCountry[draft.country || '']?.find((entry) => entry.value === draft.region)?.label ||
      draft.region;
    parts.push(regionLabel);
  }
  if (draft.mainGoal) {
    parts.push(copy.goals?.[draft.mainGoal] || draft.mainGoal);
  }

  return parts;
}

function getFriendlyAck(questionIndex, nextDraft, answer, copy) {
  const normalizedAnswer = normalizeComparable(answer);

  if (questionIndex === 0) {
    const typeLabel = nextDraft.businessType
      ? copy.businessTypes?.[nextDraft.businessType] || nextDraft.businessType
      : '';

    if (typeLabel) {
      return nextDraft.businessName
        ? `${nextDraft.businessName} sounds lovely. I’m reading that as a ${typeLabel} profile so far.`
        : `Cute, I’m already getting ${typeLabel} energy from that business description.`;
    }

    return 'That gives me a helpful starting picture, even if Seraphina still has a few detective notes to gather.';
  }

  if (questionIndex === 1) {
    const countryLabel = nextDraft.country
      ? copy.countries?.[nextDraft.country] || nextDraft.country
      : '';

    if (countryLabel && nextDraft.ruralArea) {
      return `${countryLabel} is locked in, and I’ve got a first read on the rural setting too.`;
    }

    return 'Nice, location always helps the matching stop guessing.';
  }

  if (questionIndex === 2) {
    if (nextDraft.businessSize && nextDraft.yearsInOperation) {
      return 'Perfect, now I have a rough scale and maturity read for the business.';
    }

    if (nextDraft.specialTags.length > 0) {
      return 'That gives me a few useful profile qualifiers too.';
    }

    return 'That helps me size the business a little better, even if we may refine it in the full form.';
  }

  if (questionIndex === 3) {
    const goalLabel = nextDraft.mainGoal
      ? copy.goals?.[nextDraft.mainGoal] || nextDraft.mainGoal
      : '';

    if (goalLabel && nextDraft.mainGoal !== 'other') {
      if (nextDraft.grantScopePreference === 'regionalOnly') {
        return `Nice, that sounds closest to ${goalLabel.toLowerCase()}, and you want to keep it regional.`;
      }

      if (nextDraft.grantScopePreference === 'regionalAndGeneral') {
        return `Nice, that sounds closest to ${goalLabel.toLowerCase()}, and I’ll keep the broader grant net open too.`;
      }

      return `Nice, that sounds closest to ${goalLabel.toLowerCase()}.`;
    }

    return 'That gives me a useful project angle, even if it is a little custom-shaped.';
  }

  return 'Thanks, that helps.';
}

function getNextQuestionLead(nextQuestionIndex, nextDraft) {
  if (nextQuestionIndex === 1 && !nextDraft.businessType) {
    return 'One tiny follow-up from me: I may want to confirm the business type in the full form.';
  }

  if (nextQuestionIndex === 2 && !nextDraft.country) {
    return 'I still need a clearer location pin, but we can keep moving.';
  }

  if (nextQuestionIndex === 3 && !nextDraft.businessSize) {
    return 'I may still need to tighten the business scale in the full form, but this is enough to keep going.';
  }

  return '';
}

function getCurrentQuestionPrompt(questionIndex, questions) {
  return questions[questionIndex] || questions[questions.length - 1];
}

function getSideQuestionResponse(answer, currentQuestionIndex, questions) {
  const normalizedAnswer = normalizeComparable(answer);

  if (/(stupid|idiot|dumb|shut up|hate you|kill yourself|sex|sexy|nude|racist|slur)/.test(normalizedAnswer)) {
    return `I’m here to keep this respectful and useful. I can still help with the funding process, so let’s continue with this: ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/who are you|what are you|what do you do/.test(normalizedAnswer)) {
    return `I’m Seraphina, the FundWise guide. Think of me as a grant-savvy grey cat with decent manners and a job to make this form less annoying. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/how are you|hows it going|how are you doing/.test(normalizedAnswer)) {
    return `I’m doing nicely, thank you. Calm, focused, and professionally curious. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/\b(favorite|favourite|fav|fave)\s+color\b|\bwhat(?:s| is)\s+your\s+color\b/.test(normalizedAnswer)) {
    return `A soft blue-grey feels right for me. Very official, very feline, and unlikely to clash with a government portal. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/\b(favorite|favourite|fav|fave)\s+(treat|treats|food|snack|snacks)\b|\bwhat(?:s| is)\s+your\s+(favorite|favourite|fav|fave)\b|\bfood\b.*\b(favorite|favourite|fav|fave)\b/.test(normalizedAnswer)) {
    return `Probably something elegant and bribery-adjacent, like salmon treats. Strictly off the record. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/\b(favorite|favourite|fav|fave)\s+season\b|\bwhat(?:s| is)\s+your\s+(favorite|favourite|fav|fave)\s+season\b/.test(normalizedAnswer)) {
    return `Autumn feels right to me. Calm air, good colours, and fewer dramatic surprises than summer funding portals. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/\b(favorite|favourite|fav|fave)\s+place\b|\bwhere would you go\b|\bwhere do you like to be\b/.test(normalizedAnswer)) {
    return `Somewhere quiet with a window, a tidy desk, and absolutely no missing attachments. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/\b(favorite|favourite|fav|fave)\s+animal\b|\bwhat animal would you be\b/.test(normalizedAnswer)) {
    return `Professionally, I should say “a helpful guide.” Realistically, still a cat. I have a brand to maintain. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/fun|for fun|hobby|hobbies|what do you like to do/.test(normalizedAnswer)) {
    return `I enjoy translating confusing funding language into normal human language, which is a niche hobby but an honest one. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/how does this work|what does this do|why are you asking/.test(normalizedAnswer)) {
    return `I ask a few quick setup questions, prefill the intake form, and then the full tool handles the deeper matching. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/hello|hi|hey|good morning|good afternoon/.test(normalizedAnswer)) {
    return `Hi back. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/thank you|thanks/.test(normalizedAnswer)) {
    return `Any time. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}`;
  }

  if (/help|what should i say|example/.test(normalizedAnswer)) {
    if (currentQuestionIndex === 0) {
      return 'A simple answer is enough, like “I run a small flower farm” or “I manage a rural tourism studio.” What is your business, and what kind of work do you do?';
    }

    if (currentQuestionIndex === 1) {
      return 'You can say something like “We are based in rural Andalusia, Spain” or “Occitanie in France, not rural.” Where is the business based, and is it mainly rural or not?';
    }

    if (currentQuestionIndex === 2) {
      return 'Even a rough answer works, like “micro business, 3 years old, women-owned and sustainable” or “mid-cap, 400 employees, operating since 2018.” Roughly how big is the business, how long have you been operating, and do any tags fit?';
    }

    return 'You can say something like “irrigation improvements and a website, regional only” or “software upgrades and broader grants too.” What are you hoping to fund or improve right now, and do you want just regional grants or general grants too?';
  }

  return '';
}

function buildAgentPrompt({
  answer,
  currentQuestionIndex,
  nextQuestionIndex,
  nextDraft,
  shouldComplete,
  questions,
}) {
  const nextQuestion = questions[nextQuestionIndex] || '';

  return [
    'ONBOARDING MODE: true',
    `USER ANSWER: ${answer}`,
    `CURRENT QUESTION: ${questions[currentQuestionIndex]}`,
    `NEXT QUESTION: ${nextQuestion}`,
    `SHOULD COMPLETE: ${shouldComplete ? 'yes' : 'no'}`,
    `INFERRED PROFILE: ${JSON.stringify({
      businessName: nextDraft.businessName,
      businessType: nextDraft.businessType,
      agricultureSubType: nextDraft.agricultureSubType,
      country: nextDraft.country,
      region: nextDraft.region,
      businessSize: nextDraft.businessSize,
      yearsInOperation: nextDraft.yearsInOperation,
      ruralArea: nextDraft.ruralArea,
      mainGoal: nextDraft.mainGoal,
      otherMainGoal: nextDraft.otherMainGoal,
      specialTags: nextDraft.specialTags,
      grantScopePreference: nextDraft.grantScopePreference,
    })}`,
  ].join('\n');
}

function AgentOnboardingPanel({ language, onLanguageChange, onComplete, onSkip }) {
  const copy = getTranslation(language);
  const ui = agentUiCopy[language] || agentUiCopy.en;
  const questions = useMemo(() => agentQuestionSets[language] || agentQuestionSets.en, [language]);
  const [draft, setDraft] = useState({
    ...initialDraft,
    preferredLanguage: language || defaultLanguage,
  });
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi! I’m Seraphina, your FundWise guide. ${questions[0]}`,
    },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [clarificationCounts, setClarificationCounts] = useState({});
  const [answerHistory, setAnswerHistory] = useState([]);
  const [pendingSkipToForm, setPendingSkipToForm] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: `Hi! I’m Seraphina, your FundWise guide. ${questions[0]}`,
      },
    ]);
  }, [questions]);

  useEffect(() => {
    onLanguageChange?.(language || defaultLanguage);
  }, [language, onLanguageChange]);

  useEffect(() => {
    if (!isComplete) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onComplete(draft);
    }, 1650);

    return () => window.clearTimeout(timeoutId);
  }, [draft, isComplete, onComplete]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed || isComplete || isTyping) {
      return;
    }

    const normalized = normalizeComparable(trimmed);

    if (pendingSkipToForm) {
      const isConfirmingSkip = /^(yes|yeah|yep|please do|go ahead|sure|ok|okay|confirm)$/i.test(normalized);
      const isCancellingSkip = /^(no|not yet|never mind|nope|cancel)$/i.test(normalized);

      setMessages((current) => [...current, { role: 'user', text: trimmed }]);
      setInputValue('');
      setPendingSkipToForm(false);

      if (isConfirmingSkip) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', text: 'Absolutely. I’m opening the intake form now so you can continue there.' },
        ]);
        setIsComplete(true);
        return;
      }

      if (isCancellingSkip) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', text: `No problem. ${getCurrentQuestionPrompt(currentQuestionIndex, questions)}` },
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', text: 'Just to confirm, would you like me to take you to the full intake form now?' },
      ]);
      setPendingSkipToForm(true);
      return;
    }

    if (/(take me to the intake form|take me to the form|open the intake form|go to the intake form|go to the full form|skip to the form|take me to the full form)/.test(normalized)) {
      setMessages((current) => [
        ...current,
        { role: 'user', text: trimmed },
        { role: 'assistant', text: 'I can do that. Are you sure you want to leave the chat and open the full intake form now?' },
      ]);
      setInputValue('');
      setPendingSkipToForm(true);
      return;
    }

    const sideQuestionResponse =
      !answerLooksLikeProfileContent(trimmed, currentQuestionIndex)
        ? getSideQuestionResponse(trimmed, currentQuestionIndex, questions)
        : '';

    if (sideQuestionResponse) {
      setMessages((current) => [...current, { role: 'user', text: trimmed }]);
      setInputValue('');
      setIsTyping(true);
      try {
        const response = await askFundwiseAssistant({
          question: [
            'ONBOARDING MODE: true',
            `USER ANSWER: ${trimmed}`,
            `CURRENT QUESTION: ${questions[currentQuestionIndex]}`,
            'SIDE QUESTION: yes',
            `GUIDE THE USER BACK TO: ${questions[currentQuestionIndex]}`,
          ].join('\n'),
          language,
          submittedProfile: draft,
          profileReview: null,
          results: [],
          currentScreen: 'agent',
        });

        setMessages((current) => [
          ...current,
          { role: 'assistant', text: response.answer || sideQuestionResponse },
        ]);
      } catch {
        setMessages((current) => [...current, { role: 'assistant', text: sideQuestionResponse }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    const nextDraft = { ...draft };

    const nextAnswerHistory = [...answerHistory, trimmed];

    const inferredSignals = extractProfileSignals(trimmed, currentQuestionIndex);
    nextDraft.businessType = inferredSignals.businessType || nextDraft.businessType;
    nextDraft.businessName = inferredSignals.businessName || nextDraft.businessName;
    nextDraft.agricultureSubType = inferredSignals.agricultureSubType || nextDraft.agricultureSubType;
    nextDraft.country = inferredSignals.country || nextDraft.country;
    nextDraft.region = inferredSignals.region || nextDraft.region;
    nextDraft.ruralArea = inferredSignals.ruralArea || nextDraft.ruralArea;
    nextDraft.businessSize = inferredSignals.businessSize || nextDraft.businessSize;
    nextDraft.yearsInOperation = inferredSignals.yearsInOperation || nextDraft.yearsInOperation;
    nextDraft.grantScopePreference = inferredSignals.grantScopePreference || nextDraft.grantScopePreference;
    nextDraft.specialTags = Array.from(new Set([...nextDraft.specialTags, ...inferredSignals.specialTags]));
    if (inferredSignals.mainGoal) {
      nextDraft.mainGoal = inferredSignals.mainGoal;
      nextDraft.otherMainGoal = inferredSignals.mainGoal === 'other' ? trimmed : '';
    }
    nextDraft.additionalContext = appendContext(nextDraft.additionalContext, trimmed);

    if (nextDraft.businessType === 'farm' && !nextDraft.ruralArea) {
      nextDraft.ruralArea = 'yes';
    }

    nextDraft.preferredLanguage = language || defaultLanguage;
    nextDraft.additionalContext = buildRefinedBusinessContext(nextDraft, nextAnswerHistory, copy);
    setDraft(nextDraft);
    setAnswerHistory(nextAnswerHistory);

    const nextMessages = [
      ...messages,
      { role: 'user', text: trimmed },
    ];

    const clarificationPrompt = getClarificationPrompt(currentQuestionIndex, nextDraft);
    const clarificationCount = clarificationCounts[currentQuestionIndex] || 0;

    if (clarificationPrompt && clarificationCount < 1) {
      setMessages(nextMessages);
      setInputValue('');
      setClarificationCounts((current) => ({ ...current, [currentQuestionIndex]: clarificationCount + 1 }));
      setIsTyping(true);
      try {
        const response = await askFundwiseAssistant({
          question: [
            buildAgentPrompt({
              answer: trimmed,
              currentQuestionIndex,
              nextQuestionIndex: currentQuestionIndex,
              nextDraft,
              shouldComplete: false,
              questions,
            }),
            'ASK CLARIFICATION: yes',
            `CLARIFICATION TARGET: ${clarificationPrompt}`,
          ].join('\n'),
          language,
          submittedProfile: nextDraft,
          profileReview: null,
          results: [],
          currentScreen: 'agent',
        });

        setMessages((current) => [
          ...current,
          { role: 'assistant', text: response.answer || clarificationPrompt },
        ]);
      } catch {
        setMessages((current) => [...current, { role: 'assistant', text: clarificationPrompt }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    const reachedQuestionLimit = currentQuestionIndex >= questions.length - 1;

    if (reachedQuestionLimit) {
      const summaryParts = buildSummaryParts(nextDraft, copy);
      const friendlyAck = getFriendlyAck(currentQuestionIndex, nextDraft, trimmed, copy);
      const fallbackFinalReply = summaryParts.length
        ? `${friendlyAck} I’ve prefilled ${summaryParts.join(', ')}, and I’m opening the full form so you can review everything calmly before we search.`
        : `${friendlyAck} I have enough to open the full intake form, so I’m handing it over with a few smart prefills.`;
      setMessages(nextMessages);
      setInputValue('');
      setIsTyping(true);
      try {
        const response = await askFundwiseAssistant({
          question: buildAgentPrompt({
            answer: trimmed,
            currentQuestionIndex,
            nextQuestionIndex: currentQuestionIndex,
            nextDraft,
            shouldComplete: true,
            questions,
          }),
          language,
          submittedProfile: nextDraft,
          profileReview: null,
          results: [],
          currentScreen: 'agent',
        });

        setMessages((current) => [
          ...current,
          { role: 'assistant', text: response.answer || fallbackFinalReply },
        ]);
      } catch {
        setMessages((current) => [...current, { role: 'assistant', text: fallbackFinalReply }]);
      } finally {
        setIsTyping(false);
        setIsComplete(true);
      }
      return;
    }

    const nextQuestionIndex = currentQuestionIndex + 1;
    const friendlyAck = getFriendlyAck(currentQuestionIndex, nextDraft, trimmed, copy);
    const nextLead = getNextQuestionLead(nextQuestionIndex, nextDraft);
    const fallbackReply = [friendlyAck, nextLead, questions[nextQuestionIndex]].filter(Boolean).join(' ');
    setMessages(nextMessages);
    setCurrentQuestionIndex(nextQuestionIndex);
    setClarificationCounts((current) => ({ ...current, [currentQuestionIndex]: 0 }));
    setInputValue('');
    setIsTyping(true);
    try {
      const response = await askFundwiseAssistant({
        question: buildAgentPrompt({
          answer: trimmed,
          currentQuestionIndex,
          nextQuestionIndex,
          nextDraft,
          shouldComplete: false,
          questions,
        }),
        language,
        submittedProfile: nextDraft,
        profileReview: null,
        results: [],
        currentScreen: 'agent',
      });

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: response.answer || fallbackReply,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: fallbackReply,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      if (inputValue.trim() && !isComplete && !isTyping) {
        handleSubmit(event);
      }
    }
  };

  return (
    <section className="agent-shell" aria-labelledby="agent-title">
      <div className="agent-card">
        <div className="agent-hero">
          <div className="agent-bot" aria-hidden="true">
            <SeraphinaAvatar className="agent-bot-svg" />
          </div>
          <div>
            <p className="eyebrow">{ui.guideEyebrow}</p>
            <h2 id="agent-title">{ui.title}</h2>
            <p className="panel-copy">
              {ui.intro}
            </p>
            <div className="agent-language-row">
              <label htmlFor="agentPreferredLanguage">{ui.languageLabel}</label>
              <select
                id="agentPreferredLanguage"
                value={draft.preferredLanguage}
                onChange={(event) => {
                  const nextLanguage = event.target.value || defaultLanguage;
                  setDraft((current) => ({ ...current, preferredLanguage: nextLanguage }));
                  onLanguageChange?.(nextLanguage);
                }}
                disabled={isTyping}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="agent-chat">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`agent-message agent-message-${message.role}`}
            >
              <p>{message.text}</p>
            </div>
          ))}
          {isTyping && (
            <div className="agent-message agent-message-assistant">
              <p><TypingDots /></p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form className="agent-input-row" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="agentReply">
            Reply to the AI guide
          </label>
          <textarea
            id="agentReply"
            rows="3"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ui.replyPlaceholder}
            disabled={isComplete || isTyping}
          />
          <div className="agent-input-actions">
            <p className="agent-input-hint">
              {isTyping ? ui.replyTyping : ui.replyHint}
            </p>
            <div className="agent-input-buttons">
              <button type="submit" className="primary-button" disabled={isComplete || isTyping}>
                {isComplete ? ui.openingForm : isTyping ? ui.thinking : ui.send}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onSkip}
                disabled={isComplete || isTyping}
              >
                {ui.skip}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AgentOnboardingPanel;
