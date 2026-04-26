import { useState } from 'react';
import { getTranslation } from '../i18n/translations';
import BrandBar from './BrandBar';

const headerUiCopy = {
  en: {
    businessLogin: 'Business login',
    officerLogin: 'Officer login',
    description:
      'Use business login to reopen saved funding routes and applications, or officer login to review and manage active cases.',
    returningUser: 'Returning user',
    loginTitle: 'Login to continue',
    loginBody:
      'In a production version, this is where applicants would sign in to reopen saved funding routes, application drafts, and secure messages.',
    email: 'Email',
    password: 'Password',
    stayOnPage: 'Stay on page',
    goToDashboard: 'Go to dashboard',
    programmeOfficer: 'Programme officer',
    officerBody:
      'In a production version, this is where programme officers would sign in to review assigned cases, update application stages, and message applicants securely.',
    goToOfficerDashboard: 'Go to officer dashboard',
  },
  es: {
    businessLogin: 'Acceso de empresa',
    officerLogin: 'Acceso de personal gestor',
    description:
      'Use el acceso de empresa para reabrir rutas de financiación guardadas y solicitudes, o el acceso del personal gestor para revisar y gestionar casos activos.',
    returningUser: 'Usuario recurrente',
    loginTitle: 'Inicie sesión para continuar',
    loginBody:
      'En una versión de producción, aquí es donde los solicitantes iniciarían sesión para reabrir rutas guardadas, borradores de solicitud y mensajes seguros.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    stayOnPage: 'Quedarse en la página',
    goToDashboard: 'Ir al panel',
    programmeOfficer: 'Personal gestor',
    officerBody:
      'En una versión de producción, aquí es donde el personal gestor iniciaría sesión para revisar casos asignados, actualizar etapas y enviar mensajes seguros a los solicitantes.',
    goToOfficerDashboard: 'Ir al panel del personal gestor',
  },
  it: {
    businessLogin: 'Accesso impresa',
    officerLogin: 'Accesso responsabile',
    description:
      'Usi l’accesso impresa per riaprire percorsi di finanziamento salvati e domande, oppure l’accesso del responsabile per rivedere e gestire i casi attivi.',
    returningUser: 'Utente di ritorno',
    loginTitle: 'Acceda per continuare',
    loginBody:
      'In una versione di produzione, qui i richiedenti accederebbero per riaprire percorsi salvati, bozze di domanda e messaggi sicuri.',
    email: 'Email',
    password: 'Password',
    stayOnPage: 'Resti sulla pagina',
    goToDashboard: 'Vai al pannello',
    programmeOfficer: 'Responsabile del programma',
    officerBody:
      'In una versione di produzione, qui i responsabili accederebbero per rivedere i casi assegnati, aggiornare le fasi e inviare messaggi sicuri ai richiedenti.',
    goToOfficerDashboard: 'Vai al pannello del responsabile',
  },
  pl: {
    businessLogin: 'Logowanie firmy',
    officerLogin: 'Logowanie urzędnika',
    description:
      'Użyj logowania firmy, aby wrócić do zapisanych ścieżek finansowania i wniosków, albo logowania urzędnika, aby przeglądać i prowadzić aktywne sprawy.',
    returningUser: 'Powracający użytkownik',
    loginTitle: 'Zaloguj się, aby kontynuować',
    loginBody:
      'W wersji produkcyjnej tutaj wnioskodawcy logowaliby się, aby wrócić do zapisanych ścieżek, szkiców wniosków i bezpiecznych wiadomości.',
    email: 'E-mail',
    password: 'Hasło',
    stayOnPage: 'Pozostań na stronie',
    goToDashboard: 'Przejdź do panelu',
    programmeOfficer: 'Urzędnik programu',
    officerBody:
      'W wersji produkcyjnej tutaj urzędnicy logowaliby się, aby przeglądać przypisane sprawy, aktualizować etapy i bezpiecznie kontaktować się z wnioskodawcami.',
    goToOfficerDashboard: 'Przejdź do panelu urzędnika',
  },
  fr: {
    businessLogin: 'Connexion entreprise',
    officerLogin: 'Connexion agent',
    description:
      'Utilisez la connexion entreprise pour rouvrir des parcours de financement et candidatures enregistrés, ou la connexion agent pour suivre et gérer les dossiers actifs.',
    returningUser: 'Utilisateur de retour',
    loginTitle: 'Connectez-vous pour continuer',
    loginBody:
      'Dans une version de production, c’est ici que les demandeurs se connecteraient pour rouvrir des parcours enregistrés, des brouillons de candidature et des messages sécurisés.',
    email: 'E-mail',
    password: 'Mot de passe',
    stayOnPage: 'Rester sur la page',
    goToDashboard: 'Aller au tableau de bord',
    programmeOfficer: 'Agent du programme',
    officerBody:
      'Dans une version de production, c’est ici que les agents se connecteraient pour examiner les dossiers attribués, mettre à jour les étapes et envoyer des messages sécurisés aux demandeurs.',
    goToOfficerDashboard: 'Aller au tableau de bord agent',
  },
};

function AppHeader({ language, onOpenAbout, onStayOnIntake, onApplicantLogin, onOfficerLogin }) {
  const copy = getTranslation(language);
  const ui = headerUiCopy[language] || headerUiCopy.en;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOfficerLoginModal, setShowOfficerLoginModal] = useState(false);

  return (
    <>
      <header className="hero" role="banner">
        <BrandBar language={language} />
        <div className="hero-action-bar">
          <button type="button" className="secondary-button" onClick={() => setShowLoginModal(true)}>
            {ui.businessLogin}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowOfficerLoginModal(true)}
          >
            {ui.officerLogin}
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
            {ui.description}
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
            <p className="summary-kicker">{ui.returningUser}</p>
            <h3 id="hero-login-title">{ui.loginTitle}</h3>
            <p className="panel-copy">
              {ui.loginBody}
            </p>
            <div className="hero-modal-form">
              <div className="form-field">
                <label htmlFor="heroLoginEmail">{ui.email}</label>
                <input id="heroLoginEmail" type="email" defaultValue="johndoe@abce.com" />
              </div>
              <div className="form-field">
                <label htmlFor="heroLoginPassword">{ui.password}</label>
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
                {ui.stayOnPage}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setShowLoginModal(false);
                  onApplicantLogin?.();
                }}
              >
                {ui.goToDashboard}
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
            <p className="summary-kicker">{ui.programmeOfficer}</p>
            <h3 id="hero-officer-login-title">{ui.officerLogin}</h3>
            <p className="panel-copy">
              {ui.officerBody}
            </p>
            <div className="hero-modal-form">
              <div className="form-field">
                <label htmlFor="heroOfficerLoginEmail">{ui.email}</label>
                <input id="heroOfficerLoginEmail" type="email" defaultValue="johnsmith@abcd.org" />
              </div>
              <div className="form-field">
                <label htmlFor="heroOfficerLoginPassword">{ui.password}</label>
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
                {ui.stayOnPage}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setShowOfficerLoginModal(false);
                  onOfficerLogin?.();
                }}
              >
                {ui.goToOfficerDashboard}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AppHeader;
