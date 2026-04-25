function SeraphinaAvatar({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="seraphina-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef4f7" />
        </linearGradient>
        <linearGradient id="seraphina-fur" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a4abb4" />
          <stop offset="100%" stopColor="#6f7680" />
        </linearGradient>
        <linearGradient id="seraphina-soft-fur" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c7cdd4" />
          <stop offset="100%" stopColor="#8f979f" />
        </linearGradient>
        <linearGradient id="seraphina-face" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f7f8f9" />
          <stop offset="100%" stopColor="#dde2e6" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="54" fill="url(#seraphina-bg)" stroke="#d9e7ef" strokeWidth="3" />

      <g transform="translate(4 0)">
        <path d="M21 79c0-14 14-25 33-25 18 0 31 8 36 22 2 5 1 12-3 20H38C28 96 21 89 21 79Z" fill="url(#seraphina-fur)" />
        <path d="M33 81c0 9-4 13-12 13-6 0-11-4-11-8 0-5 4-8 10-9 6-1 10 1 13 4Z" fill="url(#seraphina-soft-fur)" stroke="#646b75" strokeWidth="2.5" />

        <path d="M43 33 49 16l13 15" fill="url(#seraphina-fur)" stroke="#626973" strokeWidth="3" strokeLinejoin="round" />
        <path d="M77 33 71 16 58 31" fill="url(#seraphina-fur)" stroke="#626973" strokeWidth="3" strokeLinejoin="round" />

        <circle cx="60" cy="49" r="26" fill="url(#seraphina-fur)" stroke="#626973" strokeWidth="3" />
        <ellipse cx="60" cy="57" rx="19" ry="15" fill="url(#seraphina-face)" />

        <ellipse cx="49" cy="48" rx="5.7" ry="6.9" fill="#c8e39b" stroke="#556247" strokeWidth="1.3" />
        <ellipse cx="71" cy="48" rx="5.7" ry="6.9" fill="#c8e39b" stroke="#556247" strokeWidth="1.3" />
        <ellipse cx="49" cy="49.1" rx="2.4" ry="3.6" fill="#1e2a36" />
        <ellipse cx="71" cy="49.1" rx="2.4" ry="3.6" fill="#1e2a36" />
        <circle cx="50.7" cy="46.7" r="1" fill="#ffffff" />
        <circle cx="72.7" cy="46.7" r="1" fill="#ffffff" />

        <circle cx="44" cy="58" r="3.6" fill="#f5dbe1" opacity="0.9" />
        <circle cx="76" cy="58" r="3.6" fill="#f5dbe1" opacity="0.9" />

        <path d="M60 54.8 56.2 58h7.6Z" fill="#ce95a1" />
        <path d="M57 60.5c1.1 1.4 2.1 2.1 3 2.1s1.9-.7 3-2.1" fill="none" stroke="#6f7782" strokeWidth="1.9" strokeLinecap="round" />

        <path d="M50 57.6 36 55.6" stroke="#737b86" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M50 62H34" stroke="#737b86" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M70 57.6l14-2" stroke="#737b86" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M70 62h16" stroke="#737b86" strokeWidth="1.8" strokeLinecap="round" />

        <ellipse cx="45" cy="88" rx="11.5" ry="7.6" fill="url(#seraphina-soft-fur)" stroke="#666d77" strokeWidth="2.2" />
        <ellipse cx="72" cy="88" rx="11.5" ry="7.6" fill="url(#seraphina-soft-fur)" stroke="#666d77" strokeWidth="2.2" />
        <ellipse cx="47" cy="91" rx="6.2" ry="3.2" fill="#e6eaed" />
        <ellipse cx="70" cy="91" rx="6.2" ry="3.2" fill="#e6eaed" />
      </g>
    </svg>
  );
}

export default SeraphinaAvatar;
