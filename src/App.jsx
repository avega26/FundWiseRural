import { useEffect, useMemo, useState } from 'react';
import AppHeader from './components/AppHeader';
import AboutPanel from './components/AboutPanel';
import BrandBar from './components/BrandBar';
import AgentOnboardingPanel from './components/AgentOnboardingPanel';
import BusinessProfilePanel from './components/BusinessProfilePanel';
import FloatingAssistant from './components/FloatingAssistant';
import FundingMatchesPanel from './components/FundingMatchesPanel';
import MockApplicationPanel from './components/MockApplicationPanel';
import ApplicationDashboardPanel from './components/ApplicationDashboardPanel';
import FooterNote from './components/FooterNote';
import { generateAIRecommendations } from './aiHelper';
import { defaultLanguage } from './i18n/translations';
import { fundingPrograms } from './data/fundingPrograms';

const METRICS_STORAGE_KEY = 'fundwise-rural-demo-metrics';
const METRICS_SESSION_KEY = 'fundwise-rural-visit-tracked';

const initialMetrics = {
  pageVisits: 0,
  successfulSearches: 0,
  applicationClicks: 0,
  helpfulYes: 0,
  helpfulNo: 0,
};

const representativeDirectory = {
  france: { name: 'Camille Laurent', title: 'Occitanie programme officer' },
  spain: { name: 'Lucia Moreno', title: 'Andalusia funding officer' },
  italy: { name: 'Giulia Conti', title: 'Regional grants case manager' },
  poland: { name: 'Marta Kowalska', title: 'Managing authority case officer' },
};

function getRepresentativeForApplication(profile, recommendation) {
  const countryKey = profile?.country || '';
  const fallback = { name: 'Regional Grants Desk', title: 'Funding case manager' };
  const base = representativeDirectory[countryKey] || fallback;

  return {
    ...base,
    authority: recommendation?.routeDetails?.authority || fallback.title,
  };
}

function buildProgressSteps(status = 'draft') {
  const steps = [
    { key: 'draftSaved', label: 'Draft saved' },
    { key: 'applicationSubmitted', label: 'Application submitted' },
    { key: 'reviewOpened', label: 'Review opened' },
    { key: 'informationCheck', label: 'Information check' },
    { key: 'decisionPending', label: 'Decision pending' },
  ];

  if (status === 'submitted') {
    return steps.map((step, index) => ({
      ...step,
      state: index < 2 ? 'complete' : index === 2 ? 'current' : 'upcoming',
    }));
  }

  return steps.map((step, index) => ({
    ...step,
    state: index === 0 ? 'current' : 'upcoming',
  }));
}

function buildApplicationRecord({ profile, recommendation, draft, documentNames, status }) {
  const now = new Date().toISOString();
  const representative = getRepresentativeForApplication(profile, recommendation);
  const progressSteps = buildProgressSteps(status);
  const firstAgentMessage =
    status === 'submitted'
      ? `${representative.name} here. Your application has been received and queued for the first review pass. If we need anything else, we’ll ask for it here.`
      : `${representative.name} here. Your draft is saved. Create an account when you’re ready and you’ll be able to return, track updates, and message the grants desk.`;

  return {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status,
    submittedAt: now,
    lastUpdated: now,
    applicantName: draft.applicantName || profile?.businessName || 'Applicant',
    recommendationName: recommendation?.name || recommendation?.routeDetails?.programme || 'Funding application',
    programmeRoute: draft.programmeRoute || recommendation?.routeDetails?.programme || '',
    authority: draft.authority || recommendation?.routeDetails?.authority || '',
    location: draft.location || [recommendation?.routeDetails?.region, recommendation?.routeDetails?.country].filter(Boolean).join(', '),
    projectTitle: draft.projectTitle || '',
    progressSteps,
    currentStageKey: progressSteps.find((step) => step.state === 'current')?.key || progressSteps[0].key,
    draft,
    documentNames,
    representative,
    flags:
      status === 'submitted'
        ? []
        : [{ id: `flag-${Date.now()}`, type: 'draft', text: 'Draft saved. Applicant has not created an account yet.' }],
    messages: [
      {
        id: `msg-${Date.now()}-agent`,
        role: 'agent',
        sender: representative.name,
        timestamp: now,
        text: firstAgentMessage,
      },
    ],
  };
}

function buildSeedApplication() {
  const now = new Date().toISOString();

  return {
    id: 'seed-occitanie-erdf-demo',
    status: 'submitted',
    submittedAt: now,
    lastUpdated: now,
    applicantName: 'Atelier Lune Studio',
    recommendationName: 'Occitanie ERDF Regional Programme 2021-2027',
    programmeRoute: 'Occitanie ERDF Regional Programme 2021-2027',
    authority: 'Region Occitanie Managing Authority',
    location: 'Occitanie, France',
    projectTitle: 'Digital booking and operations upgrade for a rural creative studio',
    currentStageKey: 'informationCheck',
    progressSteps: [
      { key: 'draftSaved', label: 'Draft saved', state: 'complete' },
      { key: 'applicationSubmitted', label: 'Application submitted', state: 'complete' },
      { key: 'reviewOpened', label: 'Review opened', state: 'complete' },
      { key: 'informationCheck', label: 'Information check', state: 'current' },
      { key: 'decisionPending', label: 'Decision pending', state: 'upcoming' },
    ],
    draft: {
      applicantName: 'Atelier Lune Studio',
      projectTitle: 'Digital booking and operations upgrade for a rural creative studio',
      programmeRoute: 'Occitanie ERDF Regional Programme 2021-2027',
      authority: 'Region Occitanie Managing Authority',
      location: 'Occitanie, France',
      projectSummary:
        'The applicant is seeking support for a digital upgrade that improves online booking, customer communication, and internal workflow management for a rural creative studio.',
      fitStatement:
        'This proposal aligns with ERDF priorities around SME competitiveness, digital adoption, and regional growth in Occitanie.',
      supportRequest:
        'The application frames the project as a practical digital transition that improves resilience, customer access, and local business competitiveness.',
      evidencePlan:
        'Supplier quote for the booking platform\nShort budget note\nScreenshots of the current booking process\nProjected customer and workflow benefits',
      firstAuthorityQuestion:
        'Would a combined booking and workflow software package be eligible under the current digitalisation window?',
    },
    documentNames: ['digital-upgrade-budget.pdf', 'supplier-quote.pdf'],
    representative: {
      name: 'Camille Laurent',
      title: 'Occitanie programme officer',
      authority: 'Region Occitanie Managing Authority',
    },
    flags: [
      {
        id: 'seed-flag-1',
        type: 'missing-document',
        text: 'Please add a clearer supplier quote and a short explanation of the expected business impact.',
      },
    ],
    messages: [
      {
        id: 'seed-msg-1',
        role: 'agent',
        sender: 'Camille Laurent',
        timestamp: now,
        text:
          'Your application has moved into the information-check stage. Please upload a clearer supplier quote and a short note on the expected business impact.',
      },
      {
        id: 'seed-msg-2',
        role: 'user',
        sender: 'Atelier Lune Studio',
        timestamp: now,
        text:
          'Thank you. We can provide an updated quote and a short note on workflow savings and expected customer growth.',
      },
    ],
  };
}

function App() {
  const [userMode, setUserMode] = useState('endUser');
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [currentScreen, setCurrentScreen] = useState('agent');
  const [agentPrefill, setAgentPrefill] = useState(null);
  const [submittedProfile, setSubmittedProfile] = useState(null);
  const [profileReview, setProfileReview] = useState(null);
  const [results, setResults] = useState([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [metrics, setMetrics] = useState(initialMetrics);
  const [selectedMockRecommendation, setSelectedMockRecommendation] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeApplicationId, setActiveApplicationId] = useState(null);
  const [savedRecommendations, setSavedRecommendations] = useState([]);
  const [activeSavedRecommendationId, setActiveSavedRecommendationId] = useState(null);
  const [dashboardRole, setDashboardRole] = useState('applicant');
  const [hasApplicantSession, setHasApplicantSession] = useState(false);
  const [showMockApplicationOption, setShowMockApplicationOption] = useState(false);
  const [isLowBandwidthMode, setIsLowBandwidthMode] = useState(false);
  const isDeveloperMode = userMode === 'developer';
  const seededApplication = useMemo(() => buildSeedApplication(), []);
  const dashboardApplications = useMemo(() => {
    if (!isDeveloperMode) {
      return applications;
    }

    const hasSeed = applications.some((application) => application.id === seededApplication.id);
    return hasSeed ? applications : [seededApplication, ...applications];
  }, [applications, isDeveloperMode, seededApplication]);
  const canShowMockApplication =
    currentScreen === 'mockApplication' &&
    submittedProfile !== null &&
    profileReview !== null &&
    (selectedMockRecommendation || results[0]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(METRICS_STORAGE_KEY);

      if (stored) {
        setMetrics({
          ...initialMetrics,
          ...JSON.parse(stored),
        });
      }

      if (!window.sessionStorage.getItem(METRICS_SESSION_KEY)) {
        window.sessionStorage.setItem(METRICS_SESSION_KEY, 'true');
        updateMetrics('pageVisits');
      }
    } catch (error) {
      console.warn('Unable to load local demo metrics.', error);
    }
  }, []);

  useEffect(() => {
    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    const detectLowBandwidth = () => {
      const effectiveType = connection?.effectiveType || '';
      const saveData = Boolean(connection?.saveData);
      setIsLowBandwidthMode(
        saveData || effectiveType === 'slow-2g' || effectiveType === '2g',
      );
    };

    detectLowBandwidth();

    if (connection?.addEventListener) {
      connection.addEventListener('change', detectLowBandwidth);
      return () => connection.removeEventListener('change', detectLowBandwidth);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (currentScreen === 'agent') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentScreen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (currentScreen === 'agent') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [currentScreen]);

  const updateMetrics = (metricKey) => {
    setMetrics((current) => {
      const next = {
        ...current,
        [metricKey]: (current[metricKey] || 0) + 1,
      };

      try {
        window.localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.warn('Unable to store local demo metrics.', error);
      }

      return next;
    });
  };

  const handleFindFunding = async (profile, options = {}) => {
    const candidatePrograms = fundingPrograms;
    const { openMockApplication = false } = options;

    setCurrentLanguage(profile.preferredLanguage || defaultLanguage);
    setSubmittedProfile(profile);
    setProfileReview(null);
    setResults([]);
    setRecommendationsError('');
    setSelectedMockRecommendation(null);
    setShowMockApplicationOption(Boolean(openMockApplication));
    setCurrentScreen('results');

    if (candidatePrograms.length === 0) {
      setIsGeneratingRecommendations(false);
      return;
    }

    setIsGeneratingRecommendations(true);

    try {
      const aiResult = await generateAIRecommendations(profile, candidatePrograms);
      setProfileReview(aiResult.profileReview);
      setResults(aiResult.recommendations);

      if (aiResult.recommendations.length > 0) {
        updateMetrics('successfulSearches');
      }
    } catch (error) {
      setRecommendationsError(
        error instanceof Error
          ? error.message
          : 'Unable to generate recommendations right now.',
      );
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const handleApplicationClick = () => {
    updateMetrics('applicationClicks');
  };

  const handleHelpfulVote = (vote) => {
    updateMetrics(vote === 'yes' ? 'helpfulYes' : 'helpfulNo');
  };

  const handleResetMetrics = () => {
    setMetrics(initialMetrics);

    try {
      window.localStorage.setItem(
        METRICS_STORAGE_KEY,
        JSON.stringify(initialMetrics),
      );
      window.sessionStorage.removeItem(METRICS_SESSION_KEY);
    } catch (error) {
      console.warn('Unable to reset local demo metrics.', error);
    }
  };

  const handleStartOver = () => {
    setCurrentScreen('agent');
    setCurrentLanguage(defaultLanguage);
    setAgentPrefill(null);
    setSubmittedProfile(null);
    setProfileReview(null);
    setResults([]);
    setSelectedMockRecommendation(null);
    setActiveApplicationId(null);
    setActiveSavedRecommendationId(null);
    setDashboardRole('applicant');
    setHasApplicantSession(false);
    setShowMockApplicationOption(false);
    setRecommendationsError('');
    setIsGeneratingRecommendations(false);
  };

  const handleOpenMockApplication = (recommendation) => {
    if (!recommendation) {
      return;
    }

    setSelectedMockRecommendation(recommendation);
    setCurrentScreen('mockApplication');
  };

  const handleBackToResults = () => {
    setCurrentScreen('results');
  };

  const handleSaveMockApplication = ({ draft, documentNames, recommendation }) => {
    const application = buildApplicationRecord({
      profile: submittedProfile,
      recommendation,
      draft,
      documentNames,
      status: 'draft',
    });

    setApplications((current) => [application, ...current]);
    setActiveApplicationId(application.id);
    return application;
  };

  const handleSubmitMockApplication = ({ draft, documentNames, recommendation }) => {
    const application = buildApplicationRecord({
      profile: submittedProfile,
      recommendation,
      draft,
      documentNames,
      status: 'submitted',
    });

    setApplications((current) => [application, ...current]);
    setActiveApplicationId(application.id);
    return application;
  };

  const handleOpenDashboard = (applicationId) => {
    setHasApplicantSession(true);
    setDashboardRole('applicant');
    setActiveApplicationId(applicationId || activeApplicationId || dashboardApplications[0]?.id || null);
    setCurrentScreen('dashboard');
  };

  const handleOpenDashboardFromHomepage = (role = 'applicant') => {
    if (role === 'applicant') {
      setHasApplicantSession(true);
    }
    setDashboardRole(role);
    setActiveApplicationId((current) => current || dashboardApplications[0]?.id || null);
    setCurrentScreen('dashboard');
  };

  const handleSelectApplication = (applicationId) => {
    setActiveApplicationId(applicationId);
  };

  const handleSaveRecommendation = (recommendation) => {
    if (!recommendation) {
      return null;
    }

    const routeDetails = recommendation.routeDetails || {
      programme: recommendation.name || recommendation.title || 'EU-wide funding route',
      country: 'EU-wide',
      region: 'Multiple eligible countries',
      authority: 'European Commission / programme managing body',
    };

    const savedItem = {
      id: `saved-${recommendation.id}`,
      savedAt: new Date().toISOString(),
      recommendationId: recommendation.id,
      name: recommendation.name || recommendation.title,
      fundType: recommendation.fundType,
      fitScore: recommendation.fitScore || recommendation.matchScore * 10 || 0,
      explanation: recommendation.explanation || recommendation.relevanceNote || recommendation.summary,
      nextStep: recommendation.nextStep || recommendation.quickReason || 'Review the official route and assess eligibility details before preparing an application.',
      applicationPage: recommendation.applicationPage,
      officialPage: recommendation.officialPage,
      routeSummary: recommendation.routeSummary || recommendation.summary,
      routeDetails,
      eligibility: recommendation.eligibility || 'possible',
      submittedBusinessName: submittedProfile?.businessName || '',
    };

    setSavedRecommendations((current) => {
      const exists = current.some((item) => item.recommendationId === recommendation.id);
      if (exists) {
        return current;
      }

      return [savedItem, ...current];
    });
    setActiveSavedRecommendationId(savedItem.id);
    return savedItem;
  };

  const handleSelectSavedRecommendation = (savedRecommendationId) => {
    setActiveSavedRecommendationId(savedRecommendationId);
  };

  const handleSendApplicationMessage = (applicationId, role, text) => {
    const now = new Date().toISOString();

    setApplications((current) =>
      current.map((application) =>
        application.id !== applicationId
          ? application
          : {
              ...application,
              lastUpdated: now,
              messages: [
                ...application.messages,
                {
                  id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  role,
                  sender:
                    role === 'agent'
                      ? application.representative.name
                      : application.applicantName,
                  timestamp: now,
                  text,
                },
              ],
            },
      ),
    );
  };

  const handleUpdateApplicationStage = (applicationId, stageKey) => {
    setApplications((current) =>
      current.map((application) => {
        if (application.id !== applicationId) {
          return application;
        }

        const stageIndex = application.progressSteps.findIndex((step) => step.key === stageKey);
        const nextSteps = application.progressSteps.map((step, index) => ({
          ...step,
          state: index < stageIndex ? 'complete' : index === stageIndex ? 'current' : 'upcoming',
        }));

        return {
          ...application,
          currentStageKey: stageKey,
          lastUpdated: new Date().toISOString(),
          progressSteps: nextSteps,
        };
      }),
    );
  };

  const handleAddApplicationFlag = (applicationId, text, type = 'missing-document') => {
    const now = new Date().toISOString();

    setApplications((current) =>
      current.map((application) =>
        application.id !== applicationId
          ? application
          : {
              ...application,
              lastUpdated: now,
              flags: [
                ...application.flags,
                {
                  id: `flag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  type,
                  text,
                },
              ],
            },
      ),
    );
  };

  const handleAgentComplete = (prefill) => {
    setAgentPrefill(prefill);
    setCurrentLanguage(prefill?.preferredLanguage || defaultLanguage);
    setCurrentScreen('form');
  };

  const handleSkipAgent = () => {
    setAgentPrefill(null);
    setCurrentScreen('form');
  };

  const handleStayOnIntake = () => {
    setHasApplicantSession(true);
    setCurrentScreen('form');
    requestAnimationFrame(() => {
      document.getElementById('business-profile-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleEnableApplicantSession = () => {
    setHasApplicantSession(true);
  };

  const handleOpenAbout = () => {
    setCurrentScreen('about');
  };

  const handleBackFromAbout = () => {
    setCurrentScreen('form');
  };

  return (
    <div
      className={`app-shell${isLowBandwidthMode ? ' low-bandwidth-mode' : ''}${
        currentScreen === 'agent' ? ' app-shell-agent' : ''
      }`}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className={`page-frame${currentScreen === 'agent' ? ' page-frame-agent' : ''}`}>
        <div className="mode-toggle-bar">
          <span className="mode-toggle-label">View mode</span>
          <div className="mode-toggle" role="tablist" aria-label="View mode">
            <button
              type="button"
              className={`mode-toggle-button${!isDeveloperMode ? ' active' : ''}`}
              onClick={() => setUserMode('endUser')}
              aria-pressed={!isDeveloperMode}
            >
              End User
            </button>
            <button
              type="button"
              className={`mode-toggle-button${isDeveloperMode ? ' active' : ''}`}
              onClick={() => setUserMode('developer')}
              aria-pressed={isDeveloperMode}
            >
              Developer
            </button>
          </div>
        </div>
        {currentScreen === 'agent' ? (
          <main id="main-content" className="agent-stage">
            <div className="agent-preview" aria-hidden="true">
              <AppHeader
                language={currentLanguage}
                onOpenAbout={handleOpenAbout}
                onStayOnIntake={handleStayOnIntake}
                onApplicantLogin={() => handleOpenDashboardFromHomepage('applicant')}
                onOfficerLogin={() => handleOpenDashboardFromHomepage('agent')}
              />
              <BusinessProfilePanel
                language={currentLanguage}
                onLanguageChange={setCurrentLanguage}
                onSubmitProfile={handleFindFunding}
                initialProfile={agentPrefill}
                previewMode
                isDeveloperMode={isDeveloperMode}
              />
            </div>
            <div className="agent-overlay">
              <AgentOnboardingPanel
                language={currentLanguage}
                onLanguageChange={setCurrentLanguage}
                onComplete={handleAgentComplete}
                onSkip={handleSkipAgent}
              />
            </div>
          </main>
        ) : currentScreen === 'form' ? (
          <main id="main-content" className="screen-layout">
            <AppHeader
              language={currentLanguage}
              onOpenAbout={handleOpenAbout}
              onStayOnIntake={handleStayOnIntake}
              onApplicantLogin={() => handleOpenDashboardFromHomepage('applicant')}
              onOfficerLogin={() => handleOpenDashboardFromHomepage('agent')}
            />
            <BusinessProfilePanel
              language={currentLanguage}
              onLanguageChange={setCurrentLanguage}
              onSubmitProfile={handleFindFunding}
              initialProfile={agentPrefill}
              isDeveloperMode={isDeveloperMode}
            />
          </main>
        ) : currentScreen === 'about' ? (
          <main id="main-content" className="screen-layout">
            <BrandBar
              language={currentLanguage}
              compact
              showDashboardAccess={hasApplicantSession}
              onOpenDashboard={() => handleOpenDashboardFromHomepage('applicant')}
            />
            <AboutPanel onBack={handleBackFromAbout} />
          </main>
        ) : currentScreen === 'results' ? (
          <main id="main-content" className="screen-layout">
            <BrandBar
              language={currentLanguage}
              compact
              showDashboardAccess={hasApplicantSession}
              onOpenDashboard={() => handleOpenDashboardFromHomepage('applicant')}
            />
            <FundingMatchesPanel
              results={results}
              hasSubmitted={submittedProfile !== null}
              isLoading={isGeneratingRecommendations}
              errorMessage={recommendationsError}
              language={currentLanguage}
              businessName={submittedProfile?.businessName}
              submittedProfile={submittedProfile}
              profileReview={profileReview}
              metrics={metrics}
              isDeveloperMode={isDeveloperMode}
              canSaveResults={hasApplicantSession}
              showMockApplicationOption={showMockApplicationOption}
              onApplicationClick={handleApplicationClick}
              onHelpfulVote={handleHelpfulVote}
              onResetMetrics={handleResetMetrics}
              onOpenMockApplication={handleOpenMockApplication}
              onSaveRecommendation={handleSaveRecommendation}
              onEnableSaveLogin={handleEnableApplicantSession}
              onOpenDashboard={handleOpenDashboardFromHomepage}
              onStartOver={handleStartOver}
            />
          </main>
        ) : canShowMockApplication ? (
          <main id="main-content" className="screen-layout">
            <BrandBar
              language={currentLanguage}
              compact
              showDashboardAccess={hasApplicantSession}
              onOpenDashboard={() => handleOpenDashboardFromHomepage('applicant')}
            />
            <MockApplicationPanel
              language={currentLanguage}
              submittedProfile={submittedProfile}
              profileReview={profileReview}
              recommendation={selectedMockRecommendation || results[0]}
              onSaveDraft={handleSaveMockApplication}
              onSubmitApplication={handleSubmitMockApplication}
              onOpenDashboard={handleOpenDashboard}
              onBackToResults={handleBackToResults}
              onStartOver={handleStartOver}
            />
          </main>
        ) : currentScreen === 'dashboard' ? (
          <main id="main-content" className="screen-layout">
            <BrandBar
              language={currentLanguage}
              compact
              showDashboardAccess={hasApplicantSession}
              onOpenDashboard={() => handleOpenDashboardFromHomepage('applicant')}
            />
            <ApplicationDashboardPanel
              language={currentLanguage}
              applications={dashboardApplications}
              savedRecommendations={savedRecommendations}
              activeApplicationId={activeApplicationId}
              activeSavedRecommendationId={activeSavedRecommendationId}
              dashboardRole={dashboardRole}
              isDeveloperMode={isDeveloperMode}
              onDashboardRoleChange={setDashboardRole}
              onSelectApplication={handleSelectApplication}
              onSelectSavedRecommendation={handleSelectSavedRecommendation}
              onUpdateStage={handleUpdateApplicationStage}
              onAddFlag={handleAddApplicationFlag}
              onSendMessage={handleSendApplicationMessage}
              onBackToResults={handleBackToResults}
              onStartOver={handleStartOver}
            />
          </main>
        ) : (
          <main id="main-content" className="screen-layout">
            <BrandBar
              language={currentLanguage}
              compact
              showDashboardAccess={hasApplicantSession}
              onOpenDashboard={() => handleOpenDashboardFromHomepage('applicant')}
            />
            <FundingMatchesPanel
              results={results}
              hasSubmitted={submittedProfile !== null}
              isLoading={isGeneratingRecommendations}
              errorMessage={recommendationsError}
              language={currentLanguage}
              businessName={submittedProfile?.businessName}
              submittedProfile={submittedProfile}
              profileReview={profileReview}
              metrics={metrics}
              isDeveloperMode={isDeveloperMode}
              canSaveResults={hasApplicantSession}
              showMockApplicationOption={showMockApplicationOption}
              onApplicationClick={handleApplicationClick}
              onHelpfulVote={handleHelpfulVote}
              onResetMetrics={handleResetMetrics}
              onOpenMockApplication={handleOpenMockApplication}
              onSaveRecommendation={handleSaveRecommendation}
              onEnableSaveLogin={handleEnableApplicantSession}
              onOpenDashboard={handleOpenDashboardFromHomepage}
              onStartOver={handleStartOver}
            />
          </main>
        )}

        <FooterNote language={currentLanguage} />
        {currentScreen !== 'agent' && (
          <FloatingAssistant
            language={currentLanguage}
            currentScreen={currentScreen}
            submittedProfile={submittedProfile}
            profileReview={profileReview}
            results={results}
          />
        )}
      </div>
    </div>
  );
}

export default App;
