import { useState } from 'react';
import { getTranslation } from '../i18n/translations';
import BrandBar from './BrandBar';

function AppHeader({ language, onOpenAbout, onStayOnIntake, onApplicantLogin, onOfficerLogin }) {
  const copy = getTranslation(language);
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header className="hero" role="banner">
        <BrandBar language={language} />
        <div className="hero-description" aria-label={copy.publicDescriptionTitle}>
          <p>
            FundWise Rural is an AI-assisted funding guidance tool for rural businesses.
          </p>
        </div>
        <div className="hero-login-panel">
          <div className="hero-login-card">
            <strong>Already have an active application or account?</strong>
            <p>Sign in to review saved funding routes, open existing applications, track progress, and respond to secure case messages.</p>
            <button type="button" className="secondary-button" onClick={() => setShowLoginModal(true)}>
              Login
            </button>
          </div>
          <div className="hero-login-card">
            <strong>Programme officer access</strong>
            <p>Open the officer dashboard to review assigned cases, update stages, and flag missing information.</p>
            <button type="button" className="secondary-button" onClick={onOfficerLogin}>
              Officer login
            </button>
          </div>
        </div>
        <div className="hero-utility-row hero-utility-row-bottom">
          <button
            type="button"
            className="secondary-button secondary-button-quiet"
            onClick={onOpenAbout}
          >
            About FundWise Rural
          </button>
        </div>
      </header>
      {showLoginModal && (
        <div className="hero-modal" role="dialog" aria-modal="true" aria-labelledby="hero-login-title">
          <button
            type="button"
            className="hero-modal-backdrop"
            aria-label="Close login"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="hero-modal-card">
            <button
              type="button"
              className="hero-modal-close"
              aria-label="Close login"
              onClick={() => setShowLoginModal(false)}
            >
              x
            </button>
            <p className="summary-kicker">Returning user</p>
            <h3 id="hero-login-title">Login to continue</h3>
            <p className="panel-copy">
              In a production version, this is where applicants would sign in to reopen saved funding routes, application drafts, and secure messages.
            </p>
            <div className="hero-modal-form">
              <div className="form-field">
                <label htmlFor="heroLoginEmail">Email</label>
                <input id="heroLoginEmail" type="email" defaultValue="johndoe@abce.com" />
              </div>
              <div className="form-field">
                <label htmlFor="heroLoginPassword">Password</label>
                <input id="heroLoginPassword" type="password" defaultValue="12345" />
              </div>
            </div>
            <div className="hero-login-actions">
              <button
                type="button"
                className="secondary-button secondary-button-quiet"
                onClick={() => {
                  setShowLoginModal(false);
                  onStayOnIntake?.();
                }}
              >
                Stay on page
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setShowLoginModal(false);
                  onApplicantLogin?.();
                }}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AppHeader;
