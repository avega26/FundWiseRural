import { getTranslation } from '../i18n/translations';

function AppHeader({ language }) {
  const copy = getTranslation(language);

  return (
    <header className="hero" role="banner">
      <div className="title-row">
        <h1>FundWise Rural</h1>
        <span className="prototype-badge">{copy.badge}</span>
      </div>
      <p className="subtitle">{copy.subtitle}</p>
      <div className="hero-description" aria-label={copy.publicDescriptionTitle}>
        <p>{copy.publicDescription}</p>
      </div>
    </header>
  );
}

export default AppHeader;
