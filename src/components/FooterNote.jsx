import { getTranslation } from '../i18n/translations';

function FooterNote({ language }) {
  const copy = getTranslation(language);

  return (
    <footer className="footer-note" role="contentinfo">{copy.footerNote}</footer>
  );
}

export default FooterNote;
