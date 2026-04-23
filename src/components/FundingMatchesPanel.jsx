import { getTranslation } from '../i18n/translations';
import { useEffect, useState } from 'react';

function FundingMatchesPanel({
  results,
  hasSubmitted,
  isLoading,
  errorMessage,
  onStartOver,
  onApplicationClick,
  onHelpfulVote,
  onResetMetrics,
  language,
  businessName,
  submittedProfile,
  profileReview,
  metrics,
}) {
  const [showScoringInfo, setShowScoringInfo] = useState(false);
  const [showMetricsInfo, setShowMetricsInfo] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const copy = getTranslation(language);
  const showEmptyState = hasSubmitted && !isLoading && !errorMessage && results.length === 0;
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
      setExpandedCards({});
      return;
    }

    setExpandedCards((current) => {
      const next = {};

      results.forEach((item) => {
        next[item.id] = current[item.id] ?? true;
      });

      return next;
    });
  }, [results]);

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
        `- ${copy.businessTypeFit}: ${item.fitBreakdown.businessType}`,
        `- ${copy.projectGoalFit}: ${item.fitBreakdown.projectGoal}`,
        `- ${copy.ruralFit}: ${item.fitBreakdown.rural}`,
        `- ${copy.sizeFit}: ${item.fitBreakdown.size}`,
        `- ${copy.contextFit}: ${item.fitBreakdown.context}`,
        `- ${copy.routeFit}: ${item.fitBreakdown.routeFit}`,
        `${copy.fitReason}: ${item.explanation}`,
        `${copy.nextStep} ${item.nextStep}`,
        `${copy.draftSupport}:`,
        `- ${copy.projectSummary}: ${item.draftSupport.projectSummary}`,
        `- ${copy.fitReason}: ${item.draftSupport.fitReason}`,
        `- ${copy.applicationAngle}: ${item.draftSupport.applicationAngle}`,
        `- ${copy.evidenceToPrepare}:`,
        ...(item.draftSupport.evidenceToPrepare || []).map((entry) => `  * ${entry}`),
        `- ${copy.preSubmissionChecklist}:`,
        ...(item.draftSupport.preSubmissionChecklist || []).map((entry) => `  * ${entry}`),
        `- ${copy.firstAuthorityQuestion}: ${item.draftSupport.firstAuthorityQuestion}`,
        `- ${copy.clarificationPoint}: ${item.draftSupport.clarificationPoint}`,
        `- ${copy.verifyBeforeSubmit}: ${item.draftSupport.verifyBeforeSubmit}`,
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

  const toggleCard = (cardId) => {
    setExpandedCards((current) => ({
      ...current,
      [cardId]: !current[cardId],
    }));
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
          {results.length > 0 && (
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
          {showMetricsInfo && (
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
                    <div className="signal-list">
                      {(profileReview.detectedSignals || []).map((signal) => (
                        <span key={signal} className="signal-chip">
                          {signal}
                        </span>
                      ))}
                    </div>
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
            </div>
            <div className="helpful-card" role="group" aria-label={copy.helpfulQuestion}>
              <p>{copy.helpfulQuestion}</p>
              <div className="helpful-actions">
                <button
                  type="button"
                  className="secondary-button secondary-button-quiet"
                  onClick={() => onHelpfulVote('yes')}
                >
                  {copy.helpfulYes}
                </button>
                <button
                  type="button"
                  className="secondary-button secondary-button-quiet"
                  onClick={() => onHelpfulVote('no')}
                >
                  {copy.helpfulNo}
                </button>
              </div>
            </div>
            <p className="results-disclaimer">{copy.aiDisclaimer}</p>
          </div>

          <div className="results-container">
            {results.map((item, index) => (
              <article
                key={item.id}
                className={`fund-card ${index === 0 ? 'fund-card-featured' : ''}`}
              >
                <button
                  type="button"
                  className="fund-card-toggle"
                  onClick={() => toggleCard(item.id)}
                  aria-expanded={expandedCards[item.id] ? 'true' : 'false'}
                  aria-controls={`fund-card-panel-${item.id}`}
                >
                  <div className="fund-card-top">
                    <div className="fund-card-title-group">
                      {index === 0 && <span className="top-match-chip">{copy.topMatch}</span>}
                      <h3>{item.name}</h3>
                    </div>
                    <div className="fund-card-badges">
                      <span className={`badge ${item.fundType.toLowerCase()}`}>
                        {item.fundType}
                      </span>
                      <span className={`eligibility ${item.eligibility.toLowerCase()}`}>
                        {copy.eligibility[item.eligibility]}
                      </span>
                      <span className="card-chevron" aria-hidden="true">
                        {expandedCards[item.id] ? '−' : '+'}
                      </span>
                    </div>
                  </div>
                </button>

                {expandedCards[item.id] && (
                  <div id={`fund-card-panel-${item.id}`} className="fund-card-panel">
                    {item.routeSummary && (
                      <div className="programme-summary">
                        <strong>{copy.programmeSummary}</strong>
                        <p>{item.routeSummary}</p>
                      </div>
                    )}

                    <div className="fit-score-card">
                      <div className="fit-score-header">
                        <strong>{copy.fitScore}</strong>
                        <span>{item.fitScore}/100</span>
                      </div>
                      <div className="fit-score-bar">
                        <div
                          className="fit-score-fill"
                          style={{ width: `${item.fitScore}%` }}
                        />
                      </div>
                      <div className="fit-breakdown">
                        <p><strong>{copy.pointBreakdown}</strong></p>
                        <p>{copy.businessTypeFit}: {item.fitBreakdown.businessType}</p>
                        <p>{copy.projectGoalFit}: {item.fitBreakdown.projectGoal}</p>
                        <p>{copy.ruralFit}: {item.fitBreakdown.rural}</p>
                        <p>{copy.sizeFit}: {item.fitBreakdown.size}</p>
                        <p>{copy.contextFit}: {item.fitBreakdown.context}</p>
                        <p>{copy.routeFit}: {item.fitBreakdown.routeFit}</p>
                      </div>
                    </div>

                    <p className="match-description">{item.explanation}</p>

                    {item.rankingReason && (
                      <p className="ranking-reason">{item.rankingReason}</p>
                    )}

                    <div className="route-details">
                      <h4>{copy.routeDetails}</h4>
                      <div className="route-details-grid">
                        <p>
                          <strong>{copy.programme}</strong> {item.routeDetails.programme}
                        </p>
                        <p>
                          <strong>{copy.country}</strong> {item.routeDetails.country}
                        </p>
                        <p>
                          <strong>{copy.region}</strong> {item.routeDetails.region}
                        </p>
                        <p>
                          <strong>{copy.authority}</strong> {item.routeDetails.authority}
                        </p>
                      </div>
                      <p className="route-checked-note">{copy.reviewedLinkLabel}</p>
                    </div>

                    <div className="timeline-card">
                      <h4>{copy.estimatedTimeline}</h4>
                      <div className="timeline-list">
                        <p>{item.estimatedTimeline.prep}</p>
                        <p>{item.estimatedTimeline.submit}</p>
                        <p>{item.estimatedTimeline.review}</p>
                      </div>
                    </div>

                    <p className="next-step">
                      <strong>{copy.nextStep}</strong> {item.nextStep}
                    </p>

                    <div className="draft-support">
                      <h4>{copy.draftSupport}</h4>
                      <div className="draft-support-grid">
                        <div className="draft-support-item">
                          <strong>{copy.projectSummary}</strong>
                          <p>{item.draftSupport.projectSummary}</p>
                        </div>
                        <div className="draft-support-item">
                          <strong>{copy.fitReason}</strong>
                          <p>{item.draftSupport.fitReason}</p>
                        </div>
                        <div className="draft-support-item">
                          <strong>{copy.applicationAngle}</strong>
                          <p>{item.draftSupport.applicationAngle}</p>
                        </div>
                        <div className="draft-support-item">
                          <strong>{copy.evidenceToPrepare}</strong>
                          <ul className="draft-support-list">
                            {(item.draftSupport.evidenceToPrepare || []).map((entry, index) => (
                              <li key={index}>{entry}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="draft-support-item">
                          <strong>{copy.preSubmissionChecklist}</strong>
                          <ul className="draft-support-list">
                            {(item.draftSupport.preSubmissionChecklist || []).map((entry, index) => (
                              <li key={index}>{entry}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="draft-support-item">
                          <strong>{copy.firstAuthorityQuestion}</strong>
                          <p>{item.draftSupport.firstAuthorityQuestion}</p>
                        </div>
                        <div className="draft-support-item">
                          <strong>{copy.clarificationPoint}</strong>
                          <p>{item.draftSupport.clarificationPoint}</p>
                        </div>
                        <div className="draft-support-item">
                          <strong>{copy.verifyBeforeSubmit}</strong>
                          <p>{item.draftSupport.verifyBeforeSubmit}</p>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <a
                        className="external-link-btn"
                        href={item.applicationPage}
                        target="_blank"
                        rel="noreferrer"
                        onClick={onApplicationClick}
                      >
                        {copy.openProgrammePage(item.fundType)}
                      </a>
                      <a
                        className="official-link"
                        href={item.officialPage}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.openOfficialInfo}
                      </a>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default FundingMatchesPanel;
