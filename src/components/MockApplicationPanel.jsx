import { useEffect, useState } from 'react';
import { generateDraftApplicationSupport } from '../aiHelper';
import { getTranslation } from '../i18n/translations';

function buildMockApplicationDraft(profile, profileReview, recommendation, copy) {
  const generatedDraftSupport =
    recommendation?.draftSupport ||
    generateDraftApplicationSupport(profile, recommendation, profileReview);
  const evidenceItems = [
    ...(generatedDraftSupport?.evidenceToPrepare || []),
    ...(generatedDraftSupport?.preSubmissionChecklist || []),
  ].filter(Boolean);

  return {
    applicantName: profile?.businessName || '',
    projectTitle: `${profile?.businessName || 'Applicant'} - ${recommendation?.fundType || 'Funding'} first-stage application`,
    programmeRoute: recommendation?.routeDetails?.programme || '',
    authority: recommendation?.routeDetails?.authority || '',
    location: [recommendation?.routeDetails?.region, recommendation?.routeDetails?.country]
      .filter(Boolean)
      .join(', '),
    projectSummary:
      generatedDraftSupport?.projectSummary ||
      profileReview?.executiveSummary ||
      '',
    fitStatement:
      generatedDraftSupport?.fitReason ||
      recommendation?.explanation ||
      '',
    supportRequest:
      generatedDraftSupport?.applicationAngle ||
      recommendation?.nextStep ||
      '',
    evidencePlan: evidenceItems.join('\n'),
    firstAuthorityQuestion:
      generatedDraftSupport?.firstAuthorityQuestion || '',
  };
}

const emptyDraft = {
  applicantName: '',
  projectTitle: '',
  programmeRoute: '',
  authority: '',
  location: '',
  projectSummary: '',
  fitStatement: '',
  supportRequest: '',
  evidencePlan: '',
  firstAuthorityQuestion: '',
};

function MockApplicationPanel({
  language,
  submittedProfile,
  profileReview,
  recommendation,
  onBackToResults,
  onStartOver,
}) {
  const copy = getTranslation(language);
  const [draft, setDraft] = useState(emptyDraft);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  useEffect(() => {
    setDraft(emptyDraft);
    setHasPrefilled(false);
  }, [submittedProfile, profileReview, recommendation]);

  const handlePopulate = () => {
    setDraft(buildMockApplicationDraft(submittedProfile, profileReview, recommendation, copy));
    setHasPrefilled(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <section className="mock-application-shell" aria-labelledby="mock-application-title">
      <div className="results-page-header">
        <div>
          <p className="eyebrow">{copy.mockApplicationEyebrow || 'Mock Grant Form'}</p>
          <h2 id="mock-application-title">
            {copy.mockApplicationTitle || 'Mock first-step application'}
          </h2>
          <p className="panel-copy">
            {copy.mockApplicationDescription ||
              'This demo form shows how the intake profile and AI guidance could prefill a first-stage public funding application.'}
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

      <div className="mock-application-card">
        <div className="mock-application-topbar">
          <div>
            <p className="summary-kicker">{copy.topMatch || 'Top match'}</p>
            <h3>{recommendation?.name || recommendation?.routeDetails?.programme || '-'}</h3>
            <p className="panel-copy">
              {copy.mockApplicationHelper ||
                'Use the button below to pull in the intake form responses and AI-generated guidance as a draft for the first application step.'}
            </p>
          </div>
          <button type="button" className="primary-button" onClick={handlePopulate}>
            {copy.populateMockApplication || 'Populate from intake + AI summary'}
          </button>
        </div>

        {hasPrefilled && (
          <p className="mock-application-note" aria-live="polite">
            {copy.mockApplicationPrefilled ||
              'The draft below was prefilled from the intake form, top recommendation, and AI-generated support text.'}
          </p>
        )}

        <div className="mock-account-card" aria-label={copy.mockAccountTitle || 'Create an account'}>
          <div>
            <h4>{copy.mockAccountTitle || 'Create an account to track this application'}</h4>
            <p>
              {copy.mockAccountDescription ||
                'This is a demo-only placeholder showing how applicants could create an account to save progress, return later, and track status updates.'}
            </p>
          </div>
          <div className="mock-account-actions">
            <button type="button" className="secondary-button secondary-button-quiet">
              {copy.mockCreateAccount || 'Create account'}
            </button>
            <button type="button" className="secondary-button secondary-button-quiet">
              {copy.mockSignIn || 'Sign in'}
            </button>
          </div>
        </div>

        <div className="mock-application-grid">
          <div className="form-field">
            <label htmlFor="applicantName">{copy.mockApplicantName || 'Applicant name'}</label>
            <input
              id="applicantName"
              name="applicantName"
              type="text"
              value={draft.applicantName}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="programmeRoute">{copy.mockProgrammeRoute || 'Programme route'}</label>
            <input
              id="programmeRoute"
              name="programmeRoute"
              type="text"
              value={draft.programmeRoute}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="authority">{copy.authority}</label>
            <input
              id="authority"
              name="authority"
              type="text"
              value={draft.authority}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="location">{copy.mockLocation || 'Project location'}</label>
            <input
              id="location"
              name="location"
              type="text"
              value={draft.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="projectTitle">{copy.mockProjectTitle || 'Project title'}</label>
            <input
              id="projectTitle"
              name="projectTitle"
              type="text"
              value={draft.projectTitle}
              onChange={handleChange}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="projectSummary">{copy.projectSummary}</label>
            <textarea
              id="projectSummary"
              name="projectSummary"
              rows="5"
              value={draft.projectSummary}
              onChange={handleChange}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="fitStatement">{copy.fitReason}</label>
            <textarea
              id="fitStatement"
              name="fitStatement"
              rows="5"
              value={draft.fitStatement}
              onChange={handleChange}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="supportRequest">{copy.applicationAngle}</label>
            <textarea
              id="supportRequest"
              name="supportRequest"
              rows="4"
              value={draft.supportRequest}
              onChange={handleChange}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="evidencePlan">{copy.evidenceToPrepare}</label>
            <textarea
              id="evidencePlan"
              name="evidencePlan"
              rows="6"
              value={draft.evidencePlan}
              onChange={handleChange}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="firstAuthorityQuestion">{copy.firstAuthorityQuestion}</label>
            <textarea
              id="firstAuthorityQuestion"
              name="firstAuthorityQuestion"
              rows="3"
              value={draft.firstAuthorityQuestion}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mock-submit-bar">
          <p>
            {copy.mockSubmitDisclaimer ||
              'Demo only: this submit action is not connected to a real backend or government application portal yet.'}
          </p>
          <button type="button" className="primary-button">
            {copy.mockSubmitButton || 'Submit application'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default MockApplicationPanel;
