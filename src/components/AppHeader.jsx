import { useState } from 'react';
import { getTranslation } from '../i18n/translations';
import BrandBar from './BrandBar';

function AppHeader({ language, onOpenAbout, onStayOnIntake, onApplicantLogin, onOfficerLogin }) {
  const copy = getTranslation(language);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOfficerLoginModal, setShowOfficerLoginModal] = useState(false);

  return (
    <>
      <header className="hero" role="banner">
        <BrandBar language={language} />
        <div className="hero-action-bar">
          <button type="button" className="secondary-button" onClick={() => setShowLoginModal(true)}>
            Business login
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowOfficerLoginModal(true)}
          >
            Officer login
          </button>
          <button
            type="button"
            className="secondary-button secondary-button-quiet"
            onClick={onOpenAbout}
          >
            About FundWise Rural
          </button>
        </div>
        <div className="hero-description" aria-label={copy.publicDescriptionTitle}>
          <p>
            Use business login to reopen saved funding routes and applications, or officer login to review and manage active cases.
          </p>
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
      {showOfficerLoginModal && (
        <div className="hero-modal" role="dialog" aria-modal="true" aria-labelledby="hero-officer-login-title">
          <button
            type="button"
            className="hero-modal-backdrop"
            aria-label="Close officer login"
            onClick={() => setShowOfficerLoginModal(false)}
          />
          <div className="hero-modal-card">
            <button
              type="button"
              className="hero-modal-close"
              aria-label="Close officer login"
              onClick={() => setShowOfficerLoginModal(false)}
            >
              x
            </button>
            <p className="summary-kicker">Programme officer</p>
            <h3 id="hero-officer-login-title">Officer login</h3>
            <p className="panel-copy">
              In a production version, this is where programme officers would sign in to review assigned cases, update application stages, and message applicants securely.
            </p>
            <div className="hero-modal-form">
              <div className="form-field">
                <label htmlFor="heroOfficerLoginEmail">Email</label>
                <input id="heroOfficerLoginEmail" type="email" defaultValue="johnsmith@abcd.org" />
              </div>
              <div className="form-field">
                <label htmlFor="heroOfficerLoginPassword">Password</label>
                <input id="heroOfficerLoginPassword" type="password" defaultValue="password" />
              </div>
            </div>
            <div className="hero-login-actions">
              <button
                type="button"
                className="secondary-button secondary-button-quiet"
                onClick={() => {
                  setShowOfficerLoginModal(false);
                  onStayOnIntake?.();
                }}
              >
                Stay on page
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setShowOfficerLoginModal(false);
                  onOfficerLogin?.();
                }}
              >
                Go to officer dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AppHeader;
