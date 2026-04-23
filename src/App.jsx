import { useEffect, useState } from 'react';
import AppHeader from './components/AppHeader';
import BusinessProfilePanel from './components/BusinessProfilePanel';
import FundingMatchesPanel from './components/FundingMatchesPanel';
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
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [currentScreen, setCurrentScreen] = useState('form');
  const [submittedProfile, setSubmittedProfile] = useState(null);
  const [profileReview, setProfileReview] = useState(null);
  const [results, setResults] = useState([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [metrics, setMetrics] = useState(initialMetrics);

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

  const handleFindFunding = async (profile) => {
    const candidatePrograms = fundingPrograms;

    setCurrentLanguage(profile.preferredLanguage || defaultLanguage);
    setSubmittedProfile(profile);
    setProfileReview(null);
    setResults([]);
    setRecommendationsError('');
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
    setCurrentScreen('form');
    setCurrentLanguage(defaultLanguage);
    setSubmittedProfile(null);
    setProfileReview(null);
    setResults([]);
    setRecommendationsError('');
    setIsGeneratingRecommendations(false);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="page-frame">
        {currentScreen === 'form' ? (
          <main id="main-content" className="screen-layout">
            <AppHeader language={currentLanguage} />
            <BusinessProfilePanel
              language={currentLanguage}
              onLanguageChange={setCurrentLanguage}
              onSubmitProfile={handleFindFunding}
            />
          </main>
        ) : (
          <main id="main-content" className="screen-layout">
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
              onApplicationClick={handleApplicationClick}
              onHelpfulVote={handleHelpfulVote}
              onResetMetrics={handleResetMetrics}
              onStartOver={handleStartOver}
            />
          </main>
        )}

        <FooterNote language={currentLanguage} />
      </div>
    </div>
  );
}

export default App;
