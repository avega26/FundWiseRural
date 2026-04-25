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

function formatDocumentNames(fileList) {
  return Array.from(fileList || []).map((file) => file.name);
}

function MockApplicationPanel({
  language,
  submittedProfile,
  profileReview,
  recommendation,
  onSaveDraft,
  onSubmitApplication,
  onOpenDashboard,
  onBackToResults,
  onStartOver,
}) {
  const copy = getTranslation(language);
  const [draft, setDraft] = useState(emptyDraft);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [documentNames, setDocumentNames] = useState([]);
  const [accountPrompt, setAccountPrompt] = useState(null);

  useEffect(() => {
    setDraft(emptyDraft);
    setHasPrefilled(false);
    setDocumentNames([]);
    setAccountPrompt(null);
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

  const handleDocumentChange = (event) => {
    setDocumentNames(formatDocumentNames(event.target.files));
  };

  const handleSaveDraft = () => {
    const application = onSaveDraft?.({
      draft,
      documentNames,
      recommendation,
    });

    if (application?.id) {
      setAccountPrompt({
        applicationId: application.id,
        type: 'draft',
      });
    }
  };

  const handleSubmit = () => {
    const application = onSubmitApplication?.({
      draft,
      documentNames,
      recommendation,
    });

    if (application?.id) {
      setAccountPrompt({
        applicationId: application.id,
        type: 'submitted',
      });
    }
  };

  const handleDismissPrompt = () => {
    setAccountPrompt(null);
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

        <div className="mock-account-card" aria-label="Upload documents">
          <div>
            <h4>{copy.mockDocumentsTitle || 'Add supporting documents'}</h4>
            <p>
              {copy.mockDocumentsDescription ||
                'This demo upload area shows how applicants could attach draft budgets, project notes, quotes, or supporting evidence before formal submission.'}
            </p>
          </div>
          <div className="mock-account-actions">
            <label className="secondary-button secondary-button-quiet mock-upload-button" htmlFor="mockDocuments">
              {copy.mockDocumentsButton || 'Select documents'}
            </label>
            <input
              id="mockDocuments"
              type="file"
              multiple
              className="sr-only"
              onChange={handleDocumentChange}
            />
          </div>
        </div>

        {documentNames.length > 0 && (
          <div className="mock-document-list" aria-live="polite">
            <strong>{copy.mockDocumentsSelected || 'Selected documents'}</strong>
            <ul className="draft-support-list">
              {documentNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mock-privacy-card">
          <h4>{copy.mockPrivacyTitle || 'Privacy and security note'}</h4>
          <p>
            {copy.mockPrivacyDescription ||
              'In a production version, uploaded documents would be encrypted in transit, stored with access controls, and shared only with the applicant and the public bodies responsible for reviewing the application. This prototype treats privacy and security as core requirements rather than optional extras.'}
          </p>
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
          <div className="mock-account-actions">
            <button type="button" className="secondary-button secondary-button-quiet" onClick={handleSaveDraft}>
              {copy.mockSaveDraftButton || 'Save and finish later'}
            </button>
            <button type="button" className="primary-button" onClick={handleSubmit}>
              {copy.mockSubmitButton || 'Submit application'}
            </button>
          </div>
        </div>

      </div>
      {accountPrompt && (
        <div className="mock-account-modal" role="dialog" aria-modal="true" aria-labelledby="mock-account-modal-title">
          <button
            type="button"
            className="mock-account-modal-backdrop"
            aria-label="Close account prompt"
            onClick={handleDismissPrompt}
          />
          <div className="mock-account-modal-card" aria-live="polite">
            <button type="button" className="mock-account-close" onClick={handleDismissPrompt} aria-label="Close">
              x
            </button>
            <div>
              <p className="summary-kicker">{accountPrompt.type === 'draft' ? 'Draft saved' : 'Application submitted'}</p>
              <h4 id="mock-account-modal-title">
                {copy.mockAccountTitle || 'Create an account to track this application'}
              </h4>
              <p>
                {accountPrompt.type === 'draft'
                  ? copy.mockSavedDraftPrompt ||
                    'Your draft is saved. Create an account or sign in to return later, review the form, and track any follow-up requests from the grants team.'
                  : copy.mockSubmittedPrompt ||
                    'Your mock application has been submitted. Create an account or sign in to open your dashboard, track progress, and message the case officer securely.'}
              </p>
            </div>
            <div className="hero-modal-form">
              <div className="form-field">
                <label htmlFor="mockAccountEmail">Email</label>
                <input id="mockAccountEmail" type="email" defaultValue="johndoe@abce.com" />
              </div>
              <div className="form-field">
                <label htmlFor="mockAccountPassword">Password</label>
                <input id="mockAccountPassword" type="password" defaultValue="12345" />
              </div>
            </div>
            <div className="mock-account-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => onOpenDashboard?.(accountPrompt.applicationId)}
              >
                {copy.mockCreateAccount || 'Create account'}
              </button>
              <button
                type="button"
                className="secondary-button secondary-button-quiet"
                onClick={() => onOpenDashboard?.(accountPrompt.applicationId)}
              >
                {copy.mockSignIn || 'Sign in'}
              </button>
            </div>
            <p className="mock-account-footnote">
              Prototype note: this demo does not store real account credentials, but it shows where the sign-in step would happen before the dashboard opens.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default MockApplicationPanel;
