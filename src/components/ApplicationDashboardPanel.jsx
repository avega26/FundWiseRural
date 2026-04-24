import { useEffect, useMemo, useState } from 'react';
import { getTranslation } from '../i18n/translations';

function formatTimestamp(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function getStageLabel(steps, currentStageKey) {
  return steps.find((step) => step.key === currentStageKey)?.label || 'In progress';
}

function SavedRecommendationView({ savedRecommendation }) {
  if (!savedRecommendation) {
    return (
      <div className="dashboard-empty-card">
        <h3>No saved funding routes yet</h3>
        <p>Saved recommendations will appear here so applicants can return to them later without rerunning the whole search.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-detail-card">
      <div className="dashboard-detail-header">
        <div>
          <p className="summary-kicker">Saved funding route</p>
          <h3>{savedRecommendation.name}</h3>
        </div>
        <span className="application-status-pill application-status-submitted">
          {savedRecommendation.fitScore}/100 fit
        </span>
      </div>
      <div className="dashboard-detail-grid">
        <p><strong>Programme</strong> {savedRecommendation.routeDetails?.programme}</p>
        <p><strong>Authority</strong> {savedRecommendation.routeDetails?.authority}</p>
        <p><strong>Location</strong> {[savedRecommendation.routeDetails?.region, savedRecommendation.routeDetails?.country].filter(Boolean).join(', ')}</p>
        <p><strong>Saved</strong> {formatTimestamp(savedRecommendation.savedAt)}</p>
      </div>
      <div className="dashboard-form-preview">
        <p><strong>Summary</strong> {savedRecommendation.routeSummary || '-'}</p>
        <p><strong>Why it may fit</strong> {savedRecommendation.explanation}</p>
        <p><strong>Suggested next step</strong> {savedRecommendation.nextStep}</p>
      </div>
      <div className="dashboard-link-actions">
        <a className="external-link-btn" href={savedRecommendation.applicationPage} target="_blank" rel="noreferrer">
          Open application route
        </a>
        <a className="official-link" href={savedRecommendation.officialPage} target="_blank" rel="noreferrer">
          Open official information
        </a>
      </div>
    </div>
  );
}

function ApplicantView({
  application,
  savedRecommendation,
  applicantSection,
  onApplicantSectionChange,
  messageDraft,
  onMessageDraftChange,
  onSendMessage,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (applicantSection === 'saved') {
    return (
      <>
        <div className="dashboard-subtabs dashboard-subtabs-top">
          <button
            type="button"
            className={`dashboard-subtab${applicantSection === 'applications' ? ' active' : ''}`}
            onClick={() => onApplicantSectionChange('applications')}
          >
            Applications
          </button>
          <button
            type="button"
            className={`dashboard-subtab${applicantSection === 'saved' ? ' active' : ''}`}
            onClick={() => onApplicantSectionChange('saved')}
          >
            Saved funding
          </button>
        </div>
        <SavedRecommendationView savedRecommendation={savedRecommendation} />
      </>
    );
  }

  if (!application) {
    return (
      <>
        <div className="dashboard-subtabs dashboard-subtabs-top">
          <button
            type="button"
            className={`dashboard-subtab${applicantSection === 'applications' ? ' active' : ''}`}
            onClick={() => onApplicantSectionChange('applications')}
          >
            Applications
          </button>
          <button
            type="button"
            className={`dashboard-subtab${applicantSection === 'saved' ? ' active' : ''}`}
            onClick={() => onApplicantSectionChange('saved')}
          >
            Saved funding
          </button>
        </div>
        <div className="dashboard-empty-card">
          <h3>No applications yet</h3>
          <p>Once a draft is saved or an application is submitted, it will appear here for tracking.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-subtabs dashboard-subtabs-top">
        <button
          type="button"
          className={`dashboard-subtab${applicantSection === 'applications' ? ' active' : ''}`}
          onClick={() => onApplicantSectionChange('applications')}
        >
          Applications
        </button>
        <button
          type="button"
          className={`dashboard-subtab${applicantSection === 'saved' ? ' active' : ''}`}
          onClick={() => onApplicantSectionChange('saved')}
        >
          Saved funding
        </button>
      </div>
      <div className="dashboard-detail-card">
      <div className="dashboard-detail-header">
        <div>
          <p className="summary-kicker">Application detail</p>
          <h3>{application.projectTitle || application.recommendationName}</h3>
        </div>
        <span className={`application-status-pill application-status-${application.status}`}>
          {application.status === 'submitted' ? 'Submitted' : 'Draft saved'}
        </span>
      </div>

      <div className="dashboard-subtabs">
        <button
          type="button"
          className={`dashboard-subtab${activeTab === 'overview' ? ' active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          View application
        </button>
        <button
          type="button"
          className={`dashboard-subtab${activeTab === 'progress' ? ' active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
        <button
          type="button"
          className={`dashboard-subtab${activeTab === 'messages' ? ' active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Secure messages
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="dashboard-detail-grid">
            <p><strong>Programme</strong> {application.programmeRoute}</p>
            <p><strong>Authority</strong> {application.authority}</p>
            <p><strong>Location</strong> {application.location}</p>
            <p><strong>Current stage</strong> {getStageLabel(application.progressSteps, application.currentStageKey)}</p>
          </div>
          <div className="dashboard-form-preview">
            <p><strong>Applicant</strong> {application.draft.applicantName}</p>
            <p><strong>Project summary</strong> {application.draft.projectSummary}</p>
            <p><strong>Why this fits</strong> {application.draft.fitStatement}</p>
            <p><strong>Support request</strong> {application.draft.supportRequest}</p>
            <p><strong>Evidence plan</strong> {application.draft.evidencePlan || '-'}</p>
          </div>
        </>
      )}

      {activeTab === 'progress' && (
        <>
          <p className="dashboard-meta-line">Last updated {formatTimestamp(application.lastUpdated)}</p>
          <div className="dashboard-progress-bar">
            {application.progressSteps.map((step) => (
              <div
                key={step.key}
                className={`dashboard-progress-segment dashboard-progress-${step.state}`}
              />
            ))}
          </div>
          <div className="dashboard-step-list">
            {application.progressSteps.map((step) => (
              <div key={step.key} className={`dashboard-step-item dashboard-step-${step.state}`}>
                <span className="dashboard-step-dot" />
                <div>
                  <strong>{step.label}</strong>
                  <p>
                    {step.state === 'complete'
                      ? 'Completed'
                      : step.state === 'current'
                        ? 'Current stage'
                        : 'Upcoming'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'messages' && (
        <>
          <p className="dashboard-meta-line">
            Secure thread with {application.representative.name}, {application.representative.title}
          </p>
          <div className="dashboard-message-list">
            {application.messages.map((message) => (
              <div
                key={message.id}
                className={`dashboard-message-bubble dashboard-message-${message.role}`}
              >
                <strong>{message.sender}</strong>
                <p>{message.text}</p>
                <span>{formatTimestamp(message.timestamp)}</span>
              </div>
            ))}
          </div>
          {application.flags.length > 0 && (
            <div className="dashboard-flag-stack">
              {application.flags.map((flag) => (
                <div key={flag.id} className="dashboard-flag">
                  <strong>{flag.type === 'missing-document' ? 'Missing document' : 'Attention needed'}</strong>
                  <p>{flag.text}</p>
                </div>
              ))}
            </div>
          )}
          <div className="dashboard-message-composer">
            <textarea
              rows="3"
              value={messageDraft}
              onChange={(event) => onMessageDraftChange(event.target.value)}
              placeholder="Reply to your case representative..."
            />
            <button
              type="button"
              className="primary-button"
              onClick={() => onSendMessage(messageDraft)}
              disabled={!messageDraft.trim()}
            >
              Send reply
            </button>
          </div>
        </>
      )}
      </div>
    </>
  );
}

function AgentView({
  application,
  stageDraft,
  onStageDraftChange,
  flagDraft,
  onFlagDraftChange,
  messageDraft,
  onMessageDraftChange,
  onUpdateStage,
  onAddFlag,
  onSendMessage,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!application) {
    return (
      <div className="dashboard-empty-card">
        <h3>No assigned applications yet</h3>
        <p>Applications will show here once an applicant saves or submits through the prototype flow.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-detail-card">
      <div className="dashboard-detail-header">
        <div>
          <p className="summary-kicker">Assigned case</p>
          <h3>{application.applicantName}</h3>
        </div>
        <span className="application-status-pill application-status-agent">
          {application.representative.authority}
        </span>
      </div>

      <div className="dashboard-subtabs">
        <button
          type="button"
          className={`dashboard-subtab${activeTab === 'overview' ? ' active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Assigned grant
        </button>
        <button
          type="button"
          className={`dashboard-subtab${activeTab === 'stages' ? ' active' : ''}`}
          onClick={() => setActiveTab('stages')}
        >
          Stage controls
        </button>
        <button
          type="button"
          className={`dashboard-subtab${activeTab === 'messages' ? ' active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Case messages
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="dashboard-detail-grid">
          <p><strong>Programme</strong> {application.programmeRoute}</p>
          <p><strong>Applicant status</strong> {application.status === 'submitted' ? 'Submitted' : 'Draft only'}</p>
          <p><strong>Representative</strong> {application.representative.name}</p>
          <p><strong>Current stage</strong> {getStageLabel(application.progressSteps, application.currentStageKey)}</p>
        </div>
      )}

      {activeTab === 'stages' && (
        <div className="dashboard-agent-grid">
          <div className="dashboard-agent-card">
            <label htmlFor="agentStage"><strong>Move application stage</strong></label>
            <select id="agentStage" value={stageDraft} onChange={(event) => onStageDraftChange(event.target.value)}>
              {application.progressSteps.map((step) => (
                <option key={step.key} value={step.key}>{step.label}</option>
              ))}
            </select>
            <button type="button" className="secondary-button" onClick={() => onUpdateStage(stageDraft)}>
              Update stage
            </button>
          </div>
          <div className="dashboard-agent-card">
            <label htmlFor="agentFlag"><strong>Flag issue for applicant</strong></label>
            <textarea
              id="agentFlag"
              rows="3"
              value={flagDraft}
              onChange={(event) => onFlagDraftChange(event.target.value)}
              placeholder="Example: Please upload a clearer supplier quote or missing land-use note."
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => onAddFlag(flagDraft)}
              disabled={!flagDraft.trim()}
            >
              Add flag
            </button>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <>
          <div className="dashboard-message-list">
            {application.messages.map((message) => (
              <div
                key={message.id}
                className={`dashboard-message-bubble dashboard-message-${message.role}`}
              >
                <strong>{message.sender}</strong>
                <p>{message.text}</p>
                <span>{formatTimestamp(message.timestamp)}</span>
              </div>
            ))}
          </div>
          <div className="dashboard-message-composer">
            <textarea
              rows="3"
              value={messageDraft}
              onChange={(event) => onMessageDraftChange(event.target.value)}
              placeholder="Example: Please send the additional supplier quote and clarify the project timeline."
            />
            <button
              type="button"
              className="primary-button"
              onClick={() => onSendMessage(messageDraft)}
              disabled={!messageDraft.trim()}
            >
              Send request
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ApplicationDashboardPanel({
  language,
  applications,
  savedRecommendations,
  activeApplicationId,
  activeSavedRecommendationId,
  dashboardRole,
  onDashboardRoleChange,
  onSelectApplication,
  onSelectSavedRecommendation,
  onUpdateStage,
  onAddFlag,
  onSendMessage,
  onBackToResults,
  onStartOver,
}) {
  const copy = getTranslation(language);
  const [applicantMessageDraft, setApplicantMessageDraft] = useState('');
  const [applicantSection, setApplicantSection] = useState('applications');
  const [agentMessageDraft, setAgentMessageDraft] = useState('');
  const [agentFlagDraft, setAgentFlagDraft] = useState('');
  const activeApplication = useMemo(
    () => applications.find((application) => application.id === activeApplicationId) || applications[0] || null,
    [applications, activeApplicationId],
  );
  const activeSavedRecommendation = useMemo(
    () =>
      savedRecommendations.find((item) => item.id === activeSavedRecommendationId) ||
      savedRecommendations[0] ||
      null,
    [savedRecommendations, activeSavedRecommendationId],
  );
  const [agentStageDraft, setAgentStageDraft] = useState(activeApplication?.currentStageKey || '');

  useEffect(() => {
    if (activeApplication?.currentStageKey) {
      setAgentStageDraft(activeApplication.currentStageKey);
    }
  }, [activeApplication]);

  const handleApplicantMessage = (text) => {
    if (!activeApplication || !text.trim()) return;
    onSendMessage(activeApplication.id, 'user', text.trim());
    setApplicantMessageDraft('');
  };

  const handleAgentMessage = (text) => {
    if (!activeApplication || !text.trim()) return;
    onSendMessage(activeApplication.id, 'agent', text.trim());
    setAgentMessageDraft('');
  };

  const handleAddFlag = (text) => {
    if (!activeApplication || !text.trim()) return;
    onAddFlag(activeApplication.id, text.trim(), 'missing-document');
    setAgentFlagDraft('');
  };

  const handleUpdateStage = (stageKey) => {
    if (!activeApplication || !stageKey) return;
    onUpdateStage(activeApplication.id, stageKey);
  };

  return (
    <section className="dashboard-shell" aria-labelledby="dashboard-title">
      <div className="results-page-header">
        <div>
          <p className="eyebrow">Application dashboard</p>
          <h2 id="dashboard-title">Track applications and case progress</h2>
          <p className="panel-copy">
            This phase-two prototype shows how applicants and grant managers could track drafts,
            submissions, stage updates, secure messages, and missing-information flags after the
            recommendation flow.
          </p>
        </div>
        <div className="results-header-actions">
          <button type="button" className="secondary-button secondary-button-quiet" onClick={onBackToResults}>
            {copy.backToResults || 'Back to results'}
          </button>
          <button type="button" className="secondary-button" onClick={onStartOver}>
            {copy.startOver}
          </button>
        </div>
      </div>

      <div className="dashboard-role-toggle">
        <button
          type="button"
          className={`mode-toggle-button${dashboardRole === 'applicant' ? ' active' : ''}`}
          onClick={() => onDashboardRoleChange('applicant')}
        >
          End-user view
        </button>
        <button
          type="button"
          className={`mode-toggle-button${dashboardRole === 'agent' ? ' active' : ''}`}
          onClick={() => onDashboardRoleChange('agent')}
        >
          Officer view
        </button>
      </div>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-card">
            <p className="summary-kicker">{dashboardRole === 'agent' ? 'Applications' : applicantSection === 'saved' ? 'Saved routes' : 'Applications'}</p>
            <h3>
              {dashboardRole === 'agent'
                ? 'Assigned cases'
                : applicantSection === 'saved'
                  ? 'Saved funding routes'
                  : 'My applications'}
            </h3>
            <div className="dashboard-application-list">
              {(dashboardRole === 'agent' || applicantSection === 'applications') && applications.length === 0 ? (
                <p className="panel-copy">No applications yet.</p>
              ) : dashboardRole !== 'agent' && applicantSection === 'saved' && savedRecommendations.length === 0 ? (
                <p className="panel-copy">No saved funding routes yet.</p>
              ) : (
                (dashboardRole === 'agent' || applicantSection === 'applications'
                  ? applications.map((application) => (
                      <button
                        key={application.id}
                        type="button"
                        className={`dashboard-application-item${application.id === activeApplication?.id ? ' active' : ''}`}
                        onClick={() => onSelectApplication(application.id)}
                      >
                        <strong>{application.projectTitle || application.recommendationName}</strong>
                        <span>{application.programmeRoute}</span>
                        <span>{getStageLabel(application.progressSteps, application.currentStageKey)}</span>
                      </button>
                    ))
                  : savedRecommendations.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`dashboard-application-item${item.id === activeSavedRecommendation?.id ? ' active' : ''}`}
                        onClick={() => onSelectSavedRecommendation(item.id)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.routeDetails?.programme}</span>
                        <span>{item.fitScore}/100 fit</span>
                      </button>
                    )))
              )}
            </div>
          </div>
        </aside>

        <div className="dashboard-main">
          {dashboardRole === 'applicant' ? (
            <ApplicantView
              application={activeApplication}
              savedRecommendation={activeSavedRecommendation}
              applicantSection={applicantSection}
              onApplicantSectionChange={setApplicantSection}
              messageDraft={applicantMessageDraft}
              onMessageDraftChange={setApplicantMessageDraft}
              onSendMessage={handleApplicantMessage}
            />
          ) : (
            <AgentView
              application={activeApplication}
              stageDraft={agentStageDraft}
              onStageDraftChange={setAgentStageDraft}
              flagDraft={agentFlagDraft}
              onFlagDraftChange={setAgentFlagDraft}
              messageDraft={agentMessageDraft}
              onMessageDraftChange={setAgentMessageDraft}
              onUpdateStage={handleUpdateStage}
              onAddFlag={handleAddFlag}
              onSendMessage={handleAgentMessage}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default ApplicationDashboardPanel;
