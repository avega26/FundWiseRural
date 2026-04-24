import { useEffect, useState } from 'react';
import AppHeader from './components/AppHeader';
import BrandBar from './components/BrandBar';
import AgentOnboardingPanel from './components/AgentOnboardingPanel';
import BusinessProfilePanel from './components/BusinessProfilePanel';
import FloatingAssistant from './components/FloatingAssistant';
import FundingMatchesPanel from './components/FundingMatchesPanel';
import MockApplicationPanel from './components/MockApplicationPanel';
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
  const isDeveloperMode = userMode === 'developer';
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
        if (openMockApplication) {
          setSelectedMockRecommendation(aiResult.recommendations[0]);
          setCurrentScreen('mockApplication');
        }
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

  const handleAgentComplete = (prefill) => {
    setAgentPrefill(prefill);
    setCurrentLanguage(prefill?.preferredLanguage || defaultLanguage);
    setCurrentScreen('form');
  };

  const handleSkipAgent = () => {
    setAgentPrefill(null);
    setCurrentScreen('form');
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="page-frame">
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
              <AppHeader language={currentLanguage} />
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
            <AppHeader language={currentLanguage} />
            <BusinessProfilePanel
              language={currentLanguage}
              onLanguageChange={setCurrentLanguage}
              onSubmitProfile={handleFindFunding}
              initialProfile={agentPrefill}
              isDeveloperMode={isDeveloperMode}
            />
          </main>
        ) : currentScreen === 'results' ? (
          <main id="main-content" className="screen-layout">
            <BrandBar language={currentLanguage} compact />
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
              onApplicationClick={handleApplicationClick}
              onHelpfulVote={handleHelpfulVote}
              onResetMetrics={handleResetMetrics}
              onOpenMockApplication={handleOpenMockApplication}
              onStartOver={handleStartOver}
            />
          </main>
        ) : canShowMockApplication ? (
          <main id="main-content" className="screen-layout">
            <BrandBar language={currentLanguage} compact />
            <MockApplicationPanel
              language={currentLanguage}
              submittedProfile={submittedProfile}
              profileReview={profileReview}
              recommendation={selectedMockRecommendation || results[0]}
              onBackToResults={handleBackToResults}
              onStartOver={handleStartOver}
            />
          </main>
        ) : (
          <main id="main-content" className="screen-layout">
            <BrandBar language={currentLanguage} compact />
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
              onApplicationClick={handleApplicationClick}
              onHelpfulVote={handleHelpfulVote}
              onResetMetrics={handleResetMetrics}
              onOpenMockApplication={handleOpenMockApplication}
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
