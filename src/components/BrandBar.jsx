import { getTranslation } from '../i18n/translations';

function BrandBar({ language, compact = false }) {
  const copy = getTranslation(language);

  return (
    <div className={`brand-shell ${compact ? 'brand-shell-compact' : ''}`}>
      <div className="brand-row">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 72 72" className="brand-mark-svg">
            <defs>
              <linearGradient id="fundwiseSky" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#0b7bb4" />
                <stop offset="100%" stopColor="#00558b" />
              </linearGradient>
              <linearGradient id="fundwiseField" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#56b36e" />
                <stop offset="100%" stopColor="#2f8c4b" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="64" height="64" rx="22" fill="url(#fundwiseSky)" />
            <path d="M14 47c7-10 17-15 30-15 6 0 11 1 14 2v18H14V47Z" fill="url(#fundwiseField)" />
            <path d="M23 50c5-8 11-12 18-12 4 0 8 .8 11 1.9V52H23v-2Z" fill="#8fd39e" opacity="0.9" />
            <circle cx="52" cy="20" r="6" fill="#ffd35a" />
            <path d="M25 46V23c0-4.4 3.6-8 8-8h0v31h-8Z" fill="#f7fbfd" />
            <path d="M33 18c7 0 13 6 13 13-8 0-13-5-13-13Z" fill="#d8f4df" />
            <path d="M33 22c-5 0-9 4-9 9 5 0 9-4 9-9Z" fill="#b8e5c2" />
            <path d="M44 43c0-6 4.8-10.8 10.8-10.8 0 6-4.8 10.8-10.8 10.8Z" fill="#ffffff" opacity="0.92" />
          </svg>
        </div>
        <div className="brand-copy">
          <div className="title-row">
            <h1>FundWise Rural</h1>
            <span className="prototype-badge">{copy.badge}</span>
          </div>
          <p className="subtitle">{copy.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default BrandBar;
