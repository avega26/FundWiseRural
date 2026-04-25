import { useEffect, useRef, useState } from 'react';
import { askFundwiseAssistant } from '../aiHelper';
import { countryOptions, defaultLanguage, getTranslation, languageOptions, regionsByCountry } from '../i18n/translations';
import SeraphinaAvatar from './SeraphinaAvatar';

const agentQuestions = [
  'What is your business called, and what kind of work do you do?',
  'Where is the business based, and is it mainly rural or not?',
  'Roughly how big is the business, how long have you been operating, and do any tags fit like women-owned, youth-owned, cooperative, sustainable, or innovative?',
  'What are you hoping to fund or improve right now, and do you want just regional grants or general grants too?',
];

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

  const weArePattern = text.match(/(?:we are|i run|i own|my business is|i manage|our business is|this is)\s+([^,.!\n]{2,60})/i);
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
    .replace(/^(a|an|the)\s+/i, '')
    .replace(/\b(and|that|which)\b.*$/i, '')
    .replace(/\b(a|an|the)\s+(farm|business|company|studio|shop)\b.*$/i, '')
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

function inferGoal(text) {
  const normalized = normalizeComparable(text);

  if (/(digit|website|booking|software|ecommerce|online)/.test(normalized)) {
    return 'digitize';
  }
  if (/(sustain|green|energy|water|irrigation|efficiency|solar)/.test(normalized)) {
    return 'sustainabilityUpgrade';
  }
  if (/(equipment|machine|tractor|tool|purchase)/.test(normalized)) {
    return 'buyEquipment';
  }
  if (/(expand|growth|larger|new location|scale)/.test(normalized)) {
    return 'expandOperations';
  }
  if (/(hire|staff|employees|team)/.test(normalized)) {
    return 'hireStaff';
  }

  return 'other';
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

  if (/(micro|solo|just me|1 employee|2 employees|3 employees|4 employees|5 employees|under 10)/.test(normalized)) {
    return 'micro';
  }

  if (/(small|10 employees|20 employees|30 employees|40 employees|under 50)/.test(normalized)) {
    return 'small';
  }

  if (/(medium|50 employees|100 employees|200 employees|under 250)/.test(normalized)) {
    return 'medium';
  }

  return '';
}

function inferYearsInOperation(text) {
  const normalized = normalizeComparable(text);
  const yearNumberMatch = normalized.match(/(\d+)\s*(?:years?|yrs?)/);

  if (yearNumberMatch) {
    const years = Number(yearNumberMatch[1]);
    if (Number.isFinite(years)) {
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

function answerLooksLikeProfileContent(text, questionIndex) {
  const normalized = normalizeComparable(text);

  if (!normalized) {
    return false;
  }

  const generalSignals = [
    inferBusinessType(text),
    inferBusinessName(text),
    inferCountryAndRegion(text).country,
    inferCountryAndRegion(text).region,
    inferRuralArea(text),
    inferBusinessSize(text),
    inferYearsInOperation(text),
    inferGoal(text),
    inferGrantScope(text),
    ...inferSpecialTags(text),
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

  if (questionIndex === 2 && /(\d+|micro|small|medium|years?|owned|innovative|sustainable|cooperative)/.test(normalized)) {
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
  const sizeLabel = copy.businessSizes?.[draft.businessSize] || draft.businessSize || '';
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
    const sizePhrase = sizeLabel ? `${sizeLabel} ` : '';
    sentences.push(`${subject} is a ${sizePhrase}${typePhrase}`.replace(/\s+/g, ' ').trim() + '.');
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
    return 'I still need a rough sense of scale. Is the business micro, small, or medium, how long has it been operating, and do any profile tags fit?';
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

function getCurrentQuestionPrompt(questionIndex) {
  return agentQuestions[questionIndex] || agentQuestions[agentQuestions.length - 1];
}

function getSideQuestionResponse(answer, currentQuestionIndex) {
  const normalizedAnswer = normalizeComparable(answer);

  if (/who are you|what are you|what do you do/.test(normalizedAnswer)) {
    return `I’m Seraphina, the FundWise guide. Think of me as a grant-savvy grey cat with decent manners and a job to make this form less annoying. ${getCurrentQuestionPrompt(currentQuestionIndex)}`;
  }

  if (/how does this work|what does this do|why are you asking/.test(normalizedAnswer)) {
    return `I ask a few quick setup questions, prefill the intake form, and then the full tool handles the deeper matching. ${getCurrentQuestionPrompt(currentQuestionIndex)}`;
  }

  if (/hello|hi|hey|good morning|good afternoon/.test(normalizedAnswer)) {
    return `Hi back. ${getCurrentQuestionPrompt(currentQuestionIndex)}`;
  }

  if (/thank you|thanks/.test(normalizedAnswer)) {
    return `Any time. ${getCurrentQuestionPrompt(currentQuestionIndex)}`;
  }

  if (/help|what should i say|example/.test(normalizedAnswer)) {
    if (currentQuestionIndex === 0) {
      return 'A simple answer is enough, like “I run a small flower farm” or “I manage a rural tourism studio.” What is your business, and what kind of work do you do?';
    }

    if (currentQuestionIndex === 1) {
      return 'You can say something like “We are based in rural Andalusia, Spain” or “Occitanie in France, not rural.” Where is the business based, and is it mainly rural or not?';
    }

    if (currentQuestionIndex === 2) {
      return 'Even a rough answer works, like “micro business, 3 years old, women-owned and sustainable.” Roughly how big is the business, how long have you been operating, and do any tags fit?';
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
}) {
  const nextQuestion = agentQuestions[nextQuestionIndex] || '';

  return [
    'ONBOARDING MODE: true',
    `USER ANSWER: ${answer}`,
    `CURRENT QUESTION: ${agentQuestions[currentQuestionIndex]}`,
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
  const [draft, setDraft] = useState({
    ...initialDraft,
    preferredLanguage: language || defaultLanguage,
  });
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi! I’m Seraphina, your FundWise guide. ${agentQuestions[0]}`,
    },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [clarificationCounts, setClarificationCounts] = useState({});
  const [answerHistory, setAnswerHistory] = useState([]);
  const chatEndRef = useRef(null);

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

    const sideQuestionResponse =
      !answerLooksLikeProfileContent(trimmed, currentQuestionIndex)
        ? getSideQuestionResponse(trimmed, currentQuestionIndex)
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
            `CURRENT QUESTION: ${agentQuestions[currentQuestionIndex]}`,
            'SIDE QUESTION: yes',
            `GUIDE THE USER BACK TO: ${agentQuestions[currentQuestionIndex]}`,
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

    if (currentQuestionIndex === 0) {
      nextDraft.businessType = inferBusinessType(trimmed);
      nextDraft.businessName = draft.businessName || inferBusinessName(trimmed);
      nextDraft.agricultureSubType = draft.agricultureSubType || inferAgricultureSubType(trimmed);
      nextDraft.additionalContext = appendContext('', trimmed);
      if (nextDraft.businessType === 'farm') {
        nextDraft.ruralArea = 'yes';
      }
    }

    if (currentQuestionIndex === 1) {
      const location = inferCountryAndRegion(trimmed);
      nextDraft.country = location.country || nextDraft.country;
      nextDraft.region = location.region || nextDraft.region;
      nextDraft.ruralArea = inferRuralArea(trimmed) || nextDraft.ruralArea;
      nextDraft.additionalContext = appendContext(nextDraft.additionalContext, trimmed);
    }

    if (currentQuestionIndex === 2) {
      nextDraft.businessSize = inferBusinessSize(trimmed) || nextDraft.businessSize;
      nextDraft.yearsInOperation = inferYearsInOperation(trimmed) || nextDraft.yearsInOperation;
      nextDraft.specialTags = Array.from(new Set([
        ...nextDraft.specialTags,
        ...inferSpecialTags(trimmed),
      ]));
      nextDraft.additionalContext = appendContext(nextDraft.additionalContext, trimmed);
    }

    if (currentQuestionIndex === 3) {
      const inferredGoal = inferGoal(trimmed);
      nextDraft.mainGoal = inferredGoal || nextDraft.mainGoal;
      nextDraft.otherMainGoal = inferredGoal === 'other' ? trimmed : '';
      nextDraft.grantScopePreference = inferGrantScope(trimmed) || nextDraft.grantScopePreference;
      nextDraft.additionalContext = appendContext(nextDraft.additionalContext, trimmed);
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

    const reachedQuestionLimit = currentQuestionIndex >= agentQuestions.length - 1;

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
    const fallbackReply = [friendlyAck, nextLead, agentQuestions[nextQuestionIndex]].filter(Boolean).join(' ');
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
            <p className="eyebrow">AI Guide</p>
            <h2 id="agent-title">Meet Seraphina</h2>
            <p className="panel-copy">
              Seraphina will ask a few quick questions to understand your business, then help you start the full form with some details already filled in.
            </p>
            <div className="agent-language-row">
              <label htmlFor="agentPreferredLanguage">Preferred language</label>
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
            placeholder="Type your reply here..."
            disabled={isComplete || isTyping}
          />
          <div className="agent-input-actions">
            <p className="agent-input-hint">
              {isTyping ? 'Seraphina is replying…' : 'Press Enter to send, or Shift+Enter for a new line.'}
            </p>
            <div className="agent-input-buttons">
              <button type="submit" className="primary-button" disabled={isComplete || isTyping}>
                {isComplete ? 'Opening form…' : isTyping ? 'Thinking…' : 'Send'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onSkip}
                disabled={isComplete || isTyping}
              >
                Skip to full form
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AgentOnboardingPanel;
