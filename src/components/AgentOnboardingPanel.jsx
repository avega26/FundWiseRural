import { useEffect, useState } from 'react';
import { countryOptions, defaultLanguage, getTranslation, regionsByCountry } from '../i18n/translations';

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

  const leading = text.match(/^([A-Z][A-Za-z&'\-]+(?:\s+[A-Z][A-Za-z&'\-]+){0,3})/);
  return leading?.[1]?.trim() || '';
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
    if (normalized.includes(option.value) || normalized.includes(option.labelKey)) {
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

    return 'That gives me a helpful starting picture, even if Clover still has a few detective notes to gather.';
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
    return `I’m Clover, the FundWise guide. Think of me as a grant-savvy grey cat with decent manners and a job to make this form less annoying. ${getCurrentQuestionPrompt(currentQuestionIndex)}`;
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

function AgentOnboardingPanel({ language, onLanguageChange, onComplete, onSkip }) {
  const copy = getTranslation(language);
  const [draft, setDraft] = useState({
    ...initialDraft,
    preferredLanguage: language || defaultLanguage,
  });
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi! I’m Clover, your FundWise guide. ${agentQuestions[0]}`,
    },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    onLanguageChange?.(language || defaultLanguage);
  }, [language, onLanguageChange]);

  useEffect(() => {
    if (!isComplete) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onComplete(draft);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [draft, isComplete, onComplete]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed || isComplete) {
      return;
    }

    const sideQuestionResponse = getSideQuestionResponse(trimmed, currentQuestionIndex);

    if (sideQuestionResponse) {
      setMessages((current) => [
        ...current,
        { role: 'user', text: trimmed },
        { role: 'assistant', text: sideQuestionResponse },
      ]);
      setInputValue('');
      return;
    }

    const nextDraft = { ...draft };

    if (currentQuestionIndex === 0) {
      nextDraft.businessType = inferBusinessType(trimmed);
      nextDraft.businessName = draft.businessName || inferBusinessName(trimmed);
      nextDraft.agricultureSubType = draft.agricultureSubType || inferAgricultureSubType(trimmed);
      nextDraft.additionalContext = trimmed;
      if (nextDraft.businessType === 'farm') {
        nextDraft.ruralArea = 'yes';
      }
    }

    if (currentQuestionIndex === 1) {
      const location = inferCountryAndRegion(trimmed);
      nextDraft.country = location.country || nextDraft.country;
      nextDraft.region = location.region || nextDraft.region;
      nextDraft.ruralArea = inferRuralArea(trimmed) || nextDraft.ruralArea;
      nextDraft.additionalContext = [nextDraft.additionalContext, `Location note: ${trimmed}.`]
        .filter(Boolean)
        .join(' ');
    }

    if (currentQuestionIndex === 2) {
      nextDraft.businessSize = inferBusinessSize(trimmed) || nextDraft.businessSize;
      nextDraft.yearsInOperation = inferYearsInOperation(trimmed) || nextDraft.yearsInOperation;
      nextDraft.specialTags = Array.from(new Set([
        ...nextDraft.specialTags,
        ...inferSpecialTags(trimmed),
      ]));
      nextDraft.additionalContext = [nextDraft.additionalContext, `Business profile note: ${trimmed}.`]
        .filter(Boolean)
        .join(' ');
    }

    if (currentQuestionIndex === 3) {
      const inferredGoal = inferGoal(trimmed);
      nextDraft.mainGoal = inferredGoal;
      nextDraft.otherMainGoal = inferredGoal === 'other' ? trimmed : '';
      nextDraft.grantScopePreference = inferGrantScope(trimmed) || nextDraft.grantScopePreference;
      nextDraft.additionalContext = [nextDraft.additionalContext, trimmed].filter(Boolean).join(' ');
    }

    nextDraft.preferredLanguage = language || defaultLanguage;
    setDraft(nextDraft);

    const nextMessages = [
      ...messages,
      { role: 'user', text: trimmed },
    ];

    const reachedQuestionLimit = currentQuestionIndex >= agentQuestions.length - 1;
    const nextSatisfied = Boolean(nextDraft.businessType && nextDraft.country && nextDraft.mainGoal);
    const shouldComplete = reachedQuestionLimit || (currentQuestionIndex >= 2 && nextSatisfied);

    if (shouldComplete || (currentQuestionIndex === 3 && nextSatisfied)) {
      const summaryParts = buildSummaryParts(nextDraft, copy);
      const friendlyAck = getFriendlyAck(currentQuestionIndex, nextDraft, trimmed, copy);
      nextMessages.push({
        role: 'assistant',
        text: summaryParts.length
          ? `${friendlyAck} I’ve prefilled ${summaryParts.join(', ')} and I’m opening the full form so you can review everything before I get too confident.`
          : `${friendlyAck} I have enough to start the full intake form, so I’m opening it with a few prefills.`,
      });
      setMessages(nextMessages);
      setInputValue('');
      setIsComplete(true);
      return;
    }

    const nextQuestionIndex = currentQuestionIndex + 1;
    const friendlyAck = getFriendlyAck(currentQuestionIndex, nextDraft, trimmed, copy);
    const nextLead = getNextQuestionLead(nextQuestionIndex, nextDraft);
    nextMessages.push({
      role: 'assistant',
      text: [friendlyAck, nextLead, agentQuestions[nextQuestionIndex]].filter(Boolean).join(' '),
    });

    setMessages(nextMessages);
    setCurrentQuestionIndex(nextQuestionIndex);
    setInputValue('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      if (inputValue.trim() && !isComplete) {
        handleSubmit(event);
      }
    }
  };

  return (
    <section className="agent-shell" aria-labelledby="agent-title">
      <div className="agent-card">
        <div className="agent-hero">
          <div className="agent-bot" aria-hidden="true">
            <svg viewBox="0 0 120 120" className="agent-bot-svg">
              <defs>
                <linearGradient id="cloverFrame" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f7fafc" />
                  <stop offset="100%" stopColor="#e8eef3" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="51" fill="url(#cloverFrame)" stroke="#d9e8f2" strokeWidth="3" />
              <path d="M29 98c8-18 22-27 31-27s23 9 31 27" fill="#d8ebf8" />
              <path d="M35 98c6-12 15-19 25-19s19 7 25 19" fill="#d9dfe6" opacity="0.98" />
              <circle cx="60" cy="49" r="24" fill="#f2f5f8" stroke="#b8c3ce" strokeWidth="3" />
              <path d="M47 57l-12 3" stroke="#7f8b98" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M47 61l-13 0" stroke="#7f8b98" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M73 57l12 3" stroke="#7f8b98" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M73 61l13 0" stroke="#7f8b98" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M37 37c0-10 8-18 18-18 2 0 5 0 7 1-7 2-13 8-13 17H37Z" fill="#eef2f6" stroke="#b8c3ce" strokeWidth="3" />
              <path d="M83 37c0-10-8-18-18-18-2 0-5 0-7 1 7 2 13 8 13 17h12Z" fill="#eef2f6" stroke="#b8c3ce" strokeWidth="3" />
              <path d="M68 22l11-8 9 11-11 8Z" fill="#9aa6b2" />
              <circle cx="77" cy="23" r="4" fill="#ffd55c" />
              <circle cx="50" cy="48" r="3.8" fill="#163b57" />
              <circle cx="70" cy="48" r="3.8" fill="#163b57" />
              <ellipse cx="60" cy="56" rx="6.5" ry="4.4" fill="#f5c9d1" />
              <path d="M54 63c2 2 10 2 12 0" fill="none" stroke="#7f8b98" strokeWidth="3" strokeLinecap="round" />
              <circle cx="45" cy="58" r="5.5" fill="#e4e8ed" />
              <circle cx="75" cy="58" r="5.5" fill="#e4e8ed" />
              <path d="M43 83c5-5 11-8 17-8s12 3 17 8" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              <circle cx="96" cy="88" r="9" fill="#ffffff" stroke="#d9e8f2" strokeWidth="2" />
              <path d="M96 84v8M92 88h8" stroke="#4b9bc9" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="eyebrow">AI Guide</p>
            <h2 id="agent-title">Meet Clover</h2>
            <p className="panel-copy">
              Clover floats above the full intake, asks a few quick setup questions, and then hands you into the full form with smart prefills already waiting.
            </p>
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
            disabled={isComplete}
          />
          <button type="submit" className="primary-button" disabled={isComplete}>
            {isComplete ? 'Opening form…' : 'Send'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onSkip}
            disabled={isComplete}
          >
            Skip to full form
          </button>
        </form>
      </div>
    </section>
  );
}

export default AgentOnboardingPanel;
