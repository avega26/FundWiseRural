import { generateDraftApplicationSupport } from '../aiHelper';
import { generalGrantOptions } from '../data/generalGrantOptions';
import { getTranslation } from '../i18n/translations';
import { useEffect, useState } from 'react';

function FundTypeInfo({ fundType, copy }) {
  const explanation = copy.fundTypeExplainers?.[fundType];
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = `fundtype-popup-${fundType.toLowerCase()}`;

  return (
    <span className="fundtype-info">
      <span>{fundType}</span>
      {explanation && (
        <>
          <button
            type="button"
            className="fundtype-tooltip-trigger"
            onClick={() => setIsOpen(true)}
            aria-label={`${copy.learnMoreLabel || 'Learn more'} about ${fundType}`}
            aria-expanded={isOpen}
          >
            {copy.learnMoreLabel || 'Learn more'}
          </button>
          {isOpen && (
            <div className="fundtype-popup" role="dialog" aria-modal="true" aria-labelledby={dialogId}>
              <button
                type="button"
                className="fundtype-popup-backdrop"
                aria-label="Close grant explanation"
                onClick={() => setIsOpen(false)}
              />
              <div className="fundtype-popup-card">
                <div className="fundtype-popup-header">
                  <strong id={dialogId}>{fundType}</strong>
                  <button
                    type="button"
                    className="fundtype-popup-close"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close grant explanation"
                  >
                    ×
                  </button>
                </div>
                <div className="fundtype-popup-body">{explanation}</div>
              </div>
            </div>
          )}
        </>
      )}
    </span>
  );
}

function buildGeneralGrantMatches(grants, submittedProfile, profileReview, copy) {
  if (submittedProfile?.grantScopePreference === 'regionalOnly') {
    return [];
  }

  const context = `${submittedProfile?.additionalContext || ''} ${submittedProfile?.otherMainGoal || ''}`.toLowerCase();
  const businessName = submittedProfile?.businessName?.trim() || 'this business';
  const businessTypeLabel =
    copy.businessTypes?.[submittedProfile?.businessType] || 'business';
  const goalLabel =
    submittedProfile?.mainGoal === 'other'
      ? submittedProfile?.otherMainGoal?.trim() || copy.goals?.other || 'the current project'
      : copy.goals?.[submittedProfile?.mainGoal] || submittedProfile?.otherMainGoal?.trim() || 'the current project';
  const routePreference = profileReview?.routeClassification || 'mixed';

  const buildRelevanceNote = (grant, matchedSignals, score) => {
    const leadingSignals = matchedSignals.slice(0, 2).join(' and ');
    const subject = businessName === 'this business' ? 'This business' : businessName;
    const routeAngle =
      routePreference === 'cap'
        ? 'It works best as a broader complement to the agricultural route rather than a replacement for it.'
        : routePreference === 'erdf'
          ? 'It works best if the project needs a wider innovation, competitiveness, or scale-up angle beyond the regional route.'
          : 'It is most useful if you want to keep a wider EU-level option in play alongside the regional recommendations.';

    if (score >= 8) {
      return `${subject} has a stronger-than-usual reason to look at this because the ${businessTypeLabel.toLowerCase()} profile and the goal to ${goalLabel.toLowerCase()} match the programme well${leadingSignals ? `, especially through signals like ${leadingSignals}` : ''}. ${routeAngle}`;
    }

    if (score >= 5) {
      return `${subject} could still explore this if the project grows beyond a purely local grant search. The clearest fit comes from the goal to ${goalLabel.toLowerCase()}${leadingSignals ? ` and business signals such as ${leadingSignals}` : ''}. ${routeAngle}`;
    }

    return `${subject} is a lighter fit here, but this may still be worth keeping on the radar if the project develops into a broader EU-facing application. ${routeAngle}`;
  };

  return grants
    .map((grant) => {
      const goalMatch = grant.fitRules.mainGoals.includes(submittedProfile?.mainGoal) ? 3 : 0;
      const businessTypeMatch = grant.fitRules.businessTypes.includes(submittedProfile?.businessType) ? 3 : 0;
      const matchedSignals = grant.fitRules.contextSignals.filter((signal) => context.includes(signal));
      const contextMatch = Math.min(matchedSignals.length, 4);
      const ruralBoost =
        submittedProfile?.ruralArea === 'yes' &&
        ['eu-life-programme', 'eu-innovation-fund', 'eu-horizon-europe'].includes(grant.id)
          ? 1
          : 0;
      const score = goalMatch + businessTypeMatch + contextMatch + ruralBoost;

      const reasons = [];

      if (goalMatch) reasons.push('your main project goal');
      if (businessTypeMatch) reasons.push('your business type');
      if (matchedSignals.length) reasons.push(`signals like ${matchedSignals.slice(0, 2).join(' and ')}`);
      if (ruralBoost) reasons.push('its relevance to green or place-based transition work');

      return {
        ...grant,
        name: grant.title,
        fundType: 'EU',
        matchScore: score,
        fitScore: Math.min(92, 42 + score * 7),
        fitBreakdown: {
          businessType: Math.min(4, businessTypeMatch),
          projectGoal: Math.min(4, goalMatch),
          rural: ruralBoost,
          size: 1,
          context: Math.min(3, contextMatch),
          routeFit: 2,
        },
        eligibility: score >= 8 ? 'likely' : score >= 5 ? 'possible' : 'unlikely',
        explanation: buildRelevanceNote(grant, matchedSignals, score),
        relevanceNote: buildRelevanceNote(grant, matchedSignals, score),
        quickReason: reasons.length
          ? `Why it surfaced: ${reasons.join(', ')}.`
          : 'Why it surfaced: broader EU-level fit.',
        routeSummary: grant.summary,
        nextStep:
          'Review the current call, confirm applicant scope and partnership requirements, and prepare a short project framing note before opening the official route.',
        rankingReason:
          'This EU-wide route surfaced because the business profile and project goal suggest possible relevance beyond the strongest regional pathway.',
        routeDetails: {
          programme: grant.title,
          country: 'EU-wide',
          region: 'Multiple eligible countries',
          authority: 'European Commission / programme managing body',
        },
        routeContext: {
          targetApplicants: `${businessTypeLabel} applicants with projects tied to ${goalLabel.toLowerCase()}`,
          commonPriorities: matchedSignals,
          commonConstraints: ['Check current call scope', 'Confirm applicant and partnership rules'],
          regionNotes: ['This is an EU-wide route rather than a single regional grant programme.'],
        },
        estimatedTimeline: {
          prep: 'Preparation can take longer because EU-wide calls often expect a clearer framing note and stronger supporting evidence.',
          submit: 'Submission timing depends on the live call window and whether the programme uses staged or full applications.',
          review: 'Review periods vary by programme and are often longer than regional routes because of wider competition and programme complexity.',
        },
      };
    })
    .filter((grant) => grant.matchScore > 0)
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 10);
}

function FundingMatchesPanel({
  results,
  hasSubmitted,
  isLoading,
  errorMessage,
  onStartOver,
  onApplicationClick,
  onHelpfulVote,
  onResetMetrics,
  onOpenMockApplication,
  onSaveRecommendation,
  onOpenDashboard,
  canSaveResults = false,
  showMockApplicationOption = false,
  language,
  businessName,
  submittedProfile,
  profileReview,
  metrics,
  isDeveloperMode = false,
}) {
  const [showScoringInfo, setShowScoringInfo] = useState(false);
  const [showMetricsInfo, setShowMetricsInfo] = useState(false);
  const [activeResultId, setActiveResultId] = useState(null);
  const [draftSupportById, setDraftSupportById] = useState({});
  const [helpfulVote, setHelpfulVote] = useState('');
  const [savedRecommendationIds, setSavedRecommendationIds] = useState([]);
  const copy = getTranslation(language);
  const additionalGeneralGrants = buildGeneralGrantMatches(
    generalGrantOptions,
    submittedProfile,
    profileReview,
    copy,
  );
  const showEmptyState = hasSubmitted && !isLoading && !errorMessage && results.length === 0;
  const topMockApplicationCandidate =
    showMockApplicationOption && results[0]?.supportsMockApplication ? results[0] : null;
  const completionRate = metrics.pageVisits
    ? Math.round((metrics.successfulSearches / metrics.pageVisits) * 100)
    : 0;
  const clickThroughRate = metrics.successfulSearches
    ? Math.round((metrics.applicationClicks / metrics.successfulSearches) * 100)
    : 0;
  const satisfactionResponses = metrics.helpfulYes + metrics.helpfulNo;
  const satisfactionScore = satisfactionResponses
    ? Math.round((metrics.helpfulYes / satisfactionResponses) * 100)
    : 0;

  useEffect(() => {
    if (!results.length) {
      setActiveResultId(null);
      setDraftSupportById({});
      setHelpfulVote('');
      return;
    }
  }, [results]);

  const handleHelpfulClick = (vote) => {
    setHelpfulVote(vote);
    onHelpfulVote(vote);
  };

  const handleDownloadResults = () => {
    if (!results.length) {
      return;
    }

    const lines = [
      copy.resultsTitle,
      '',
      profileReview?.executiveSummary || copy.summary(results[0].fundType, businessName),
      '',
      `${copy.aiProfileReview}:`,
      `${copy.confidenceLevel}: ${copy.reviewLabels[profileReview?.confidence] || '-'}`,
      `${copy.consistencyStatus}: ${copy.reviewLabels[profileReview?.consistency] || '-'}`,
      `${copy.primaryRoute}: ${copy.reviewLabels[profileReview?.routeClassification] || '-'}`,
      profileReview?.explanation || '',
      profileReview?.note || '',
      '',
      `${copy.routeDetails}:`,
      `${copy.labels.businessName}: ${submittedProfile?.businessName || '-'}`,
      `${copy.labels.country}: ${submittedProfile?.country ? copy.countries[submittedProfile.country] : '-'}`,
      `${copy.labels.region}: ${results[0].routeDetails.region || '-'}`,
      `${copy.labels.businessType}: ${submittedProfile?.businessType ? copy.businessTypes[submittedProfile.businessType] : '-'}`,
      `${copy.labels.agricultureSubType}: ${
        submittedProfile?.agricultureSubType
          ? copy.agricultureSubTypes?.[submittedProfile.agricultureSubType]
          : '-'
      }`,
      `${copy.labels.businessSize}: ${submittedProfile?.businessSize ? copy.businessSizes[submittedProfile.businessSize] : '-'}`,
      `${copy.labels.mainGoal}: ${submittedProfile?.mainGoal ? copy.goals[submittedProfile.mainGoal] : '-'}`,
      '',
      ...results.flatMap((item, index) => [
        `${index + 1}. ${item.name} (${item.fundType})`,
        `${copy.programmeSummary}: ${item.routeSummary || '-'}`,
        `${copy.fitScore}: ${item.fitScore}/100`,
        `${copy.pointBreakdown}:`,
        `- ${copy.businessTypeFit}: ${formatBreakdown('businessType', item.fitBreakdown.businessType)}`,
        `- ${copy.projectGoalFit}: ${formatBreakdown('projectGoal', item.fitBreakdown.projectGoal)}`,
        `- ${copy.ruralFit}: ${formatBreakdown('rural', item.fitBreakdown.rural)}`,
        `- ${copy.sizeFit}: ${formatBreakdown('size', item.fitBreakdown.size)}`,
        `- ${copy.contextFit}: ${formatBreakdown('context', item.fitBreakdown.context)}`,
        `- ${copy.routeFit}: ${formatBreakdown('routeFit', item.fitBreakdown.routeFit)}`,
        `${copy.fitReason}: ${item.explanation}`,
        `${copy.nextStep} ${item.nextStep}`,
        ...(draftSupportById[item.id]
          ? [
              `${copy.draftSupport}:`,
              `- ${copy.projectSummary}: ${draftSupportById[item.id].projectSummary}`,
              `- ${copy.fitReason}: ${draftSupportById[item.id].fitReason}`,
              `- ${copy.applicationAngle}: ${draftSupportById[item.id].applicationAngle}`,
              `- ${copy.evidenceToPrepare}:`,
              ...(draftSupportById[item.id].evidenceToPrepare || []).map((entry) => `  * ${entry}`),
              `- ${copy.preSubmissionChecklist}:`,
              ...(draftSupportById[item.id].preSubmissionChecklist || []).map((entry) => `  * ${entry}`),
              `- ${copy.firstAuthorityQuestion}: ${draftSupportById[item.id].firstAuthorityQuestion}`,
              `- ${copy.clarificationPoint}: ${draftSupportById[item.id].clarificationPoint}`,
              `- ${copy.verifyBeforeSubmit}: ${draftSupportById[item.id].verifyBeforeSubmit}`,
            ]
          : []),
        `${copy.programme}: ${item.routeDetails.programme}`,
        `${copy.country}: ${item.routeDetails.country}`,
        `${copy.region}: ${item.routeDetails.region}`,
        `${copy.authority}: ${item.routeDetails.authority}`,
        `${copy.estimatedTimeline}:`,
        `- ${item.estimatedTimeline.prep}`,
        `- ${item.estimatedTimeline.submit}`,
        `- ${item.estimatedTimeline.review}`,
        `${copy.openProgrammePage(item.fundType)}: ${item.applicationPage}`,
        `${copy.openOfficialInfo}: ${item.officialPage}`,
        '',
      ]),
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileNameBase = businessName?.trim() || 'fundwise-rural-results';

    link.href = url;
    link.download = `${fileNameBase.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openResultDetail = (cardId) => {
    setActiveResultId(cardId);
  };

  const closeResultDetail = () => {
    setActiveResultId(null);
  };

  const handleGenerateDraftSupport = (item) => {
    setDraftSupportById((current) => {
      if (current[item.id]) {
        return current;
      }

      return {
        ...current,
        [item.id]: generateDraftApplicationSupport(submittedProfile, item, profileReview),
      };
    });
  };

  const handleSaveRoute = (item) => {
    if (!canSaveResults) {
      return null;
    }

    const savedItem = onSaveRecommendation?.(item);
    setSavedRecommendationIds((current) =>
      current.includes(item.id) ? current : [...current, item.id],
    );
    return savedItem;
  };

  const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
  const hasList = (value) => Array.isArray(value) && value.some((entry) => hasText(entry));
  const breakdownMax = {
    businessType: 4,
    projectGoal: 4,
    rural: 3,
    size: 2,
    context: 3,
    routeFit: 3,
  };
  const formatBreakdown = (key, value) => `${value}/${breakdownMax[key]}`;
  const activeResult = [...results, ...additionalGeneralGrants].find((item) => item.id === activeResultId) || null;
  const activeDraftSupport = activeResult ? draftSupportById[activeResult.id] : null;
  const renderDraftSupport = (item, draftSupport) => {
    if (
      !(hasText(draftSupport?.projectSummary) ||
      hasText(draftSupport?.fitReason) ||
      hasText(draftSupport?.applicationAngle) ||
      hasList(draftSupport?.evidenceToPrepare) ||
      hasList(draftSupport?.preSubmissionChecklist) ||
      hasText(draftSupport?.firstAuthorityQuestion) ||
      hasText(draftSupport?.clarificationPoint) ||
      hasText(draftSupport?.verifyBeforeSubmit))
    ) {
      return null;
    }

    return (
      <div className="draft-support">
        <h4>{copy.draftSupport}</h4>
        <div className="draft-support-grid">
          {hasText(draftSupport?.projectSummary) && (
            <div className="draft-support-item">
              <strong>{copy.projectSummary}</strong>
              <p>{draftSupport.projectSummary}</p>
            </div>
          )}
          {hasText(draftSupport?.fitReason) && (
            <div className="draft-support-item">
              <strong>{copy.fitReason}</strong>
              <p>{draftSupport.fitReason}</p>
            </div>
          )}
          {hasText(draftSupport?.applicationAngle) && (
            <div className="draft-support-item">
              <strong>{copy.applicationAngle}</strong>
              <p>{draftSupport.applicationAngle}</p>
            </div>
          )}
          {hasList(draftSupport?.evidenceToPrepare) && (
            <div className="draft-support-item">
              <strong>{copy.evidenceToPrepare}</strong>
              <ul className="draft-support-list">
                {draftSupport.evidenceToPrepare.filter((entry) => hasText(entry)).map((entry, index) => (
                  <li key={index}>{entry}</li>
                ))}
              </ul>
            </div>
          )}
          {hasList(draftSupport?.preSubmissionChecklist) && (
            <div className="draft-support-item">
              <strong>{copy.preSubmissionChecklist}</strong>
              <ul className="draft-support-list">
                {draftSupport.preSubmissionChecklist.filter((entry) => hasText(entry)).map((entry, index) => (
                  <li key={index}>{entry}</li>
                ))}
              </ul>
            </div>
          )}
          {hasText(draftSupport?.firstAuthorityQuestion) && (
            <div className="draft-support-item">
              <strong>{copy.firstAuthorityQuestion}</strong>
              <p>{draftSupport.firstAuthorityQuestion}</p>
            </div>
          )}
          {hasText(draftSupport?.clarificationPoint) && (
            <div className="draft-support-item">
              <strong>{copy.clarificationPoint}</strong>
              <p>{draftSupport.clarificationPoint}</p>
            </div>
          )}
          {hasText(draftSupport?.verifyBeforeSubmit) && (
            <div className="draft-support-item">
              <strong>{copy.verifyBeforeSubmit}</strong>
              <p>{draftSupport.verifyBeforeSubmit}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="results-shell" aria-labelledby="funding-matches-title">
      <div className="results-page-header">
        <div>
          <p className="eyebrow">{copy.resultsEyebrow}</p>
          <h2 id="funding-matches-title">{copy.resultsTitle}</h2>
          <p className="panel-copy">{copy.resultsDescription}</p>
        </div>
        <div className="results-header-actions">
          {isDeveloperMode && results.length > 0 && (
            <button
              type="button"
              className="secondary-button secondary-button-quiet"
              onClick={() => setShowMetricsInfo((current) => !current)}
              aria-expanded={showMetricsInfo}
              aria-controls="metrics-panel"
            >
              {copy.metricsButton}
            </button>
          )}
          <button type="button" className="secondary-button" onClick={onStartOver}>
            {copy.startOver}
          </button>
        </div>
      </div>

      {!hasSubmitted && (
        <div className="results-card">
          <p className="panel-copy">{copy.resultsPlaceholder}</p>
        </div>
      )}

      {isLoading && (
        <div className="results-card" role="status" aria-live="polite">
          <p className="panel-copy">{copy.generating}</p>
        </div>
      )}

      {showEmptyState && (
        <div className="results-card">
          <p className="panel-copy">{copy.noMatches}</p>
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="results-card" role="alert">
          <p className="panel-copy">{errorMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && results.length > 0 && (
        <div className="results-dashboard">
          {isDeveloperMode && showMetricsInfo && (
            <div id="metrics-panel" className="metrics-card">
              <div className="metrics-card-header">
                <h3>{copy.metricsTitle}</h3>
                <p>{copy.metricsDisclaimer}</p>
              </div>
              <div className="metrics-grid">
                <div className="metric-item">
                  <strong>{copy.metricsUsers}</strong>
                  <span>{metrics.pageVisits}</span>
                </div>
                <div className="metric-item">
                  <strong>{copy.metricsCompletedSearches}</strong>
                  <span>{metrics.successfulSearches}</span>
                </div>
                <div className="metric-item">
                  <strong>{copy.metricsCompletionRate}</strong>
                  <span>{completionRate}%</span>
                </div>
                <div className="metric-item">
                  <strong>{copy.metricsApplicationClicks}</strong>
                  <span>{metrics.applicationClicks}</span>
                </div>
                <div className="metric-item">
                  <strong>{copy.metricsClickThroughRate}</strong>
                  <span>{clickThroughRate}%</span>
                </div>
                <div className="metric-item">
                  <strong>{copy.metricsSatisfactionResponses}</strong>
                  <span>{satisfactionResponses}</span>
                </div>
                <div className="metric-item">
                  <strong>{copy.metricsSatisfactionScore}</strong>
                  <span>{satisfactionScore}%</span>
                </div>
              </div>
              <p className="metrics-footnote">{copy.metricsClickThroughNote}</p>
              <div className="metrics-actions">
                <button
                  type="button"
                  className="secondary-button secondary-button-quiet"
                  onClick={onResetMetrics}
                >
                  {copy.metricsReset}
                </button>
              </div>
            </div>
          )}

          <div className="scoring-info-card">
            <button
              type="button"
              className="scoring-info-toggle"
              onClick={() => setShowScoringInfo((current) => !current)}
              aria-expanded={showScoringInfo}
              aria-controls="scoring-info-panel"
            >
              <span className="scoring-info-icon">i</span>
              <span>{copy.scoringInfoTitle}</span>
            </button>
            {showScoringInfo && (
              <div id="scoring-info-panel" className="scoring-info-body">
                <p>{copy.scoringInfoIntro}</p>
                <ul>
                  <li>{copy.businessTypeFitDescription}</li>
                  <li>{copy.projectGoalFitDescription}</li>
                  <li>{copy.ruralFitDescription}</li>
                  <li>{copy.sizeFitDescription}</li>
                  <li>{copy.contextFitDescription}</li>
                  <li>{copy.routeFitDescription}</li>
                </ul>
                <p>{copy.scoringInfoOutro}</p>
              </div>
            )}
          </div>

          {profileReview && (
            <div className="profile-review-stack">
              <div className="profile-review-card">
                <div className="profile-review-header">
                  <h3>{copy.aiProfileReview}</h3>
                  <div className="profile-review-metrics">
                    <span className={`review-pill review-${profileReview.confidence}`}>
                      {copy.confidenceLevel}: {copy.reviewLabels[profileReview.confidence]}
                    </span>
                    <span className={`review-pill review-${profileReview.consistency}`}>
                      {copy.consistencyStatus}: {copy.reviewLabels[profileReview.consistency]}
                    </span>
                  </div>
                </div>
                <p className="profile-review-text">{profileReview.explanation}</p>
                {profileReview.note && (
                  <p className="profile-review-note">{profileReview.note}</p>
                )}
              </div>

              <div className="profile-review-card reasoning-trace-card">
                <div className="profile-review-header">
                  <h3>{copy.aiReasoningTrace}</h3>
                </div>
                <div className="reasoning-grid">
                  <div className="reasoning-item">
                    <strong>{copy.primaryRoute}</strong>
                    <p>
                      {copy.reviewLabels[profileReview.routeClassification] ||
                        copy.reviewLabels.mixed}
                    </p>
                  </div>
                  <div className="reasoning-item">
                    <strong>{copy.rankingRationale}</strong>
                    <p>{profileReview.rankingReason}</p>
                  </div>
                  <div className="reasoning-item reasoning-item-full">
                    <strong>{copy.detectedSignals}</strong>
                    {hasList(profileReview.detectedSignals) && (
                      <div className="signal-list">
                        {profileReview.detectedSignals
                          .filter((signal) => hasText(signal))
                          .map((signal) => (
                            <span key={signal} className="signal-chip">
                              {signal}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="results-summary-card">
            <div className="summary-hero">
              <div>
                <p className="summary-kicker">{copy.topMatch}</p>
                <p className="summary">
                  {profileReview?.executiveSummary ||
                    copy.summary(results[0].fundType, businessName)}
                </p>
              </div>
              <div className="summary-route-pill">
                <span>{results[0].routeDetails.programme}</span>
              </div>
            </div>
            <div className="summary-route-details">
              <p>
                <strong>{copy.programme}</strong> {results[0].routeDetails.programme}
              </p>
              <p>
                <strong>{copy.country}</strong> {results[0].routeDetails.country}
              </p>
              <p>
                <strong>{copy.region}</strong> {results[0].routeDetails.region}
              </p>
              <p>
                <strong>{copy.authority}</strong> {results[0].routeDetails.authority}
              </p>
            </div>
            <div className="summary-actions">
              <a
                className="external-link-btn summary-action-btn"
                href={results[0].applicationPage}
                target="_blank"
                rel="noreferrer"
                onClick={onApplicationClick}
              >
                {copy.openProgrammePage(results[0].fundType)}
              </a>
              <a
                className="official-link summary-action-btn"
                href={results[0].officialPage}
                target="_blank"
                rel="noreferrer"
              >
                {copy.openOfficialInfo}
              </a>
              <button
                type="button"
                className="official-link summary-action-btn action-button"
                onClick={handleDownloadResults}
              >
                {copy.downloadResults}
              </button>
              <button
                type="button"
                className="official-link summary-action-btn action-button"
                onClick={() =>
                  canSaveResults
                    ? handleSaveRoute(results[0])
                    : onOpenDashboard?.('applicant')
                }
              >
                {!canSaveResults
                  ? copy.loginToSave || 'Login to save'
                  : savedRecommendationIds.includes(results[0].id)
                  ? copy.savedToDashboard || 'Saved to dashboard'
                  : copy.saveToDashboard || 'Save to dashboard'}
              </button>
              {topMockApplicationCandidate && (
                <button
                  type="button"
                  className="official-link summary-action-btn action-button"
                  onClick={() => onOpenMockApplication?.(topMockApplicationCandidate)}
                >
                  {copy.openMockApplication || 'Start mock application form'}
                </button>
              )}
            </div>
            <p className="results-disclaimer">{copy.aiDisclaimer}</p>
          </div>

          <div className="results-container">
            {results.map((item, index) => (
              <article
                key={item.id}
                className={`fund-card ${index === 0 ? 'fund-card-featured' : ''}`}
              >
                <div className="fund-card-top">
                  <div className="fund-card-title-group">
                    {index === 0 && <span className="top-match-chip">{copy.topMatch}</span>}
                    <h3>{item.name}</h3>
                  </div>
                  <div className="fund-card-badges">
                    <span className={`badge ${item.fundType.toLowerCase()}`}>
                      <FundTypeInfo fundType={item.fundType} copy={copy} />
                    </span>
                    <span className={`eligibility ${item.eligibility.toLowerCase()}`}>
                      {copy.eligibility[item.eligibility]}
                    </span>
                  </div>
                </div>

                {item.routeSummary && (
                  <p className="result-card-summary">{item.routeSummary}</p>
                )}

                <div className="fit-score-compact">
                  <strong>{copy.fitScore}</strong>
                  <span>{item.fitScore}/100</span>
                </div>

                <p className="match-description compact-match-description">{item.explanation}</p>

                <div className="card-actions">
                  <button
                    type="button"
                    className="secondary-button secondary-button-quiet"
                    onClick={() => openResultDetail(item.id)}
                  >
                    {copy.showFullResult || 'Show full result'}
                  </button>
                  <a
                    className="external-link-btn"
                    href={item.applicationPage}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onApplicationClick}
                  >
                    {copy.openProgrammePage(item.fundType)}
                  </a>
                  <button
                    type="button"
                    className="secondary-button secondary-button-quiet"
                    onClick={() =>
                      canSaveResults
                        ? handleSaveRoute(item)
                        : onOpenDashboard?.('applicant')
                    }
                  >
                    {!canSaveResults
                      ? copy.loginToSave || 'Login to save'
                      : savedRecommendationIds.includes(item.id)
                      ? copy.savedToDashboard || 'Saved to dashboard'
                      : copy.saveToDashboard || 'Save to dashboard'}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!canSaveResults && (
            <div className="results-card save-results-note">
              <p className="panel-copy">
                {copy.saveResultsLoginNote ||
                  'Use the login option on the homepage if you want to save funding routes and revisit them later from the dashboard.'}
              </p>
            </div>
          )}

          {additionalGeneralGrants.length > 0 && (
            <div className="general-grants-card">
              <div className="profile-review-header">
                <h3>{copy.generalGrantTitle || 'EU-wide opportunities'}</h3>
              </div>
              <p className="panel-copy">
                {copy.generalGrantDescription ||
                  'These are broader EU-wide programmes that surfaced because parts of your business profile also point beyond the main regional match.'}
              </p>
              <div className="general-grants-grid">
                {additionalGeneralGrants.map((grant) => (
                  <article key={grant.id} className="general-grant-item">
                    <div className="fund-card-top">
                      <div className="fund-card-title-group">
                        <h4>{grant.title}</h4>
                      </div>
                      <span className="badge general-badge">{grant.shortType}</span>
                    </div>
                    <p>{grant.summary}</p>
                    <p className="general-grant-note">{grant.relevanceNote}</p>
                    <p className="general-grant-why">{grant.quickReason}</p>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="secondary-button secondary-button-quiet"
                        onClick={() => openResultDetail(grant.id)}
                      >
                        {copy.showFullResult || 'Show full result'}
                      </button>
                      <a
                        className="external-link-btn"
                        href={grant.applicationPage}
                        target="_blank"
                        rel="noreferrer"
                        onClick={onApplicationClick}
                      >
                        {copy.openGeneralGrant || 'Open grant info'}
                      </a>
                      <a
                        className="official-link"
                        href={grant.officialPage}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.openOfficialInfo}
                      </a>
                      <button
                        type="button"
                        className="secondary-button secondary-button-quiet"
                        onClick={() =>
                          canSaveResults
                            ? handleSaveRoute(grant)
                            : onOpenDashboard?.('applicant')
                        }
                      >
                        {!canSaveResults
                          ? copy.loginToSave || 'Login to save'
                          : savedRecommendationIds.includes(grant.id)
                            ? copy.savedToDashboard || 'Saved to dashboard'
                            : copy.saveToDashboard || 'Save to dashboard'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeResult && (
            <div className="result-overlay" role="dialog" aria-modal="true" aria-labelledby={`result-overlay-title-${activeResult.id}`}>
              <div className="result-overlay-backdrop" onClick={closeResultDetail} />
              <div className="result-overlay-panel">
                <div className="result-overlay-header">
                  <div>
                    <p className="summary-kicker">{copy.topMatch}</p>
                    <h3 id={`result-overlay-title-${activeResult.id}`}>{activeResult.name}</h3>
                  </div>
                  <button type="button" className="secondary-button secondary-button-quiet" onClick={closeResultDetail}>
                    {copy.backToResults || 'Back to results'}
                  </button>
                </div>

                <div className="result-overlay-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      canSaveResults
                        ? handleSaveRoute(activeResult)
                        : onOpenDashboard?.('applicant')
                    }
                  >
                    {!canSaveResults
                      ? copy.loginToSave || 'Login to save'
                      : savedRecommendationIds.includes(activeResult.id)
                      ? copy.savedToDashboard || 'Saved to dashboard'
                      : copy.saveToDashboard || 'Save to dashboard'}
                  </button>
                </div>

                <div className="fund-card-panel">
                  <div className="fit-score-card">
                    <div className="fit-score-header">
                      <strong>{copy.fitScore}</strong>
                      <span>{activeResult.fitScore}/100</span>
                    </div>
                    <div className="fit-score-bar">
                      <div className="fit-score-fill" style={{ width: `${activeResult.fitScore}%` }} />
                    </div>
                    <div className="fit-breakdown">
                      <p><strong>{copy.pointBreakdown}</strong></p>
                      <p>{copy.businessTypeFit}: {formatBreakdown('businessType', activeResult.fitBreakdown.businessType)}</p>
                      <p>{copy.projectGoalFit}: {formatBreakdown('projectGoal', activeResult.fitBreakdown.projectGoal)}</p>
                      <p>{copy.ruralFit}: {formatBreakdown('rural', activeResult.fitBreakdown.rural)}</p>
                      <p>{copy.sizeFit}: {formatBreakdown('size', activeResult.fitBreakdown.size)}</p>
                      <p>{copy.contextFit}: {formatBreakdown('context', activeResult.fitBreakdown.context)}</p>
                      <p>{copy.routeFit}: {formatBreakdown('routeFit', activeResult.fitBreakdown.routeFit)}</p>
                    </div>
                  </div>

                  <p className="match-description">{activeResult.explanation}</p>
                  {activeResult.rankingReason && <p className="ranking-reason">{activeResult.rankingReason}</p>}

                  <div className="route-details">
                    <h4>{copy.routeDetails}</h4>
                    <div className="route-details-grid">
                      <p><strong>{copy.programme}</strong> {activeResult.routeDetails.programme}</p>
                      <p><strong>{copy.country}</strong> {activeResult.routeDetails.country}</p>
                      <p><strong>{copy.region}</strong> {activeResult.routeDetails.region}</p>
                      <p><strong>{copy.authority}</strong> {activeResult.routeDetails.authority}</p>
                    </div>
                    <p className="route-checked-note">{copy.reviewedLinkLabel}</p>
                  </div>

                  {(hasText(activeResult.estimatedTimeline?.prep) ||
                    hasText(activeResult.estimatedTimeline?.submit) ||
                    hasText(activeResult.estimatedTimeline?.review)) && (
                    <div className="timeline-card">
                      <h4>{copy.estimatedTimeline}</h4>
                      <div className="timeline-list">
                        {hasText(activeResult.estimatedTimeline?.prep) && <p>{activeResult.estimatedTimeline.prep}</p>}
                        {hasText(activeResult.estimatedTimeline?.submit) && <p>{activeResult.estimatedTimeline.submit}</p>}
                        {hasText(activeResult.estimatedTimeline?.review) && <p>{activeResult.estimatedTimeline.review}</p>}
                      </div>
                    </div>
                  )}

                  {hasText(activeResult.nextStep) && (
                    <p className="next-step">
                      <strong>{copy.nextStep}</strong> {activeResult.nextStep}
                    </p>
                  )}

                  {activeDraftSupport ? (
                    renderDraftSupport(activeResult, activeDraftSupport)
                  ) : (
                    <div className="draft-support draft-support-prompt">
                      <h4>{copy.draftSupport}</h4>
                      <p>{copy.draftSupportPrompt || 'Generate this section only if you want a fuller application-preparation draft for this route.'}</p>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleGenerateDraftSupport(activeResult)}
                      >
                        {copy.generateDraftSupport || 'Generate draft application support'}
                      </button>
                    </div>
                  )}

                  <div className="card-actions">
                    <a
                      className="external-link-btn"
                      href={activeResult.applicationPage}
                      target="_blank"
                      rel="noreferrer"
                      onClick={onApplicationClick}
                    >
                      {activeResult.fundType === 'EU'
                        ? copy.openGeneralGrant || 'Open grant info'
                        : copy.openProgrammePage(activeResult.fundType)}
                    </a>
                    <a className="official-link" href={activeResult.officialPage} target="_blank" rel="noreferrer">
                      {copy.openOfficialInfo}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="helpful-card helpful-card-bottom" role="group" aria-label={copy.helpfulQuestion}>
            <p>{copy.helpfulQuestion}</p>
            <div className="helpful-actions">
              <button
                type="button"
                className="secondary-button secondary-button-quiet"
                onClick={() => handleHelpfulClick('yes')}
                aria-pressed={helpfulVote === 'yes'}
                disabled={helpfulVote !== ''}
              >
                {copy.helpfulYes}
              </button>
              <button
                type="button"
                className="secondary-button secondary-button-quiet"
                onClick={() => handleHelpfulClick('no')}
                aria-pressed={helpfulVote === 'no'}
                disabled={helpfulVote !== ''}
              >
                {copy.helpfulNo}
              </button>
            </div>
            {helpfulVote && (
              <p className="helpful-confirmation" aria-live="polite">
                {helpfulVote === 'yes' ? copy.helpfulThanksYes : copy.helpfulThanksNo}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default FundingMatchesPanel;
