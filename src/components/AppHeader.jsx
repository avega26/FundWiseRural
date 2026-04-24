import { getTranslation } from '../i18n/translations';
import BrandBar from './BrandBar';

function AppHeader({ language }) {
  const copy = getTranslation(language);

  return (
    <header className="hero" role="banner">
      <BrandBar language={language} />
      <div className="hero-description" aria-label={copy.publicDescriptionTitle}>
        <p>{copy.publicDescription}</p>
      </div>
    </header>
  );
}

export default AppHeader;
