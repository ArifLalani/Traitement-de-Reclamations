import facebookIcon from '../../assets/figma/facebook.svg';

export type Source = 'Facebook' | 'Google' | 'X' | 'Instagram' | 'Trustpilot' | 'LinkedIn' | 'Web';

type SourceIconProps = {
  source: Source;
};

export default function SourceIcon({ source }: SourceIconProps) {
  if (source === 'Facebook') {
    return <img src={facebookIcon} alt="" width={24} height={24} />;
  }

  const common = { width: 24, height: 24, viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' };

  switch (source) {
    case 'Google':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="12" fill="#fff" />
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.31 2.99-7.26Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.89 6.61-2.41l-3.23-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A9.99 9.99 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.41 13.93a5.99 5.99 0 0 1 0-3.86V7.48H3.06a10 10 0 0 0 0 9.04l3.35-2.59Z"
          />
          <path
            fill="#EA4335"
            d="M12 6.05c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a9.99 9.99 0 0 0-8.94 5.48l3.35 2.59C7.2 7.81 9.4 6.05 12 6.05Z"
          />
        </svg>
      );
    case 'X':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="12" fill="#000" />
          <g transform="translate(5, 4.8) scale(0.0117)">
            <path
              fill="#fff"
              d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1036.57 1146.75H873.962L569.165 687.854V687.828Z"
            />
          </g>
        </svg>
      );
    case 'Instagram':
      return (
        <svg {...common}>
          <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill="#E1306C" />
          <rect x="6.5" y="6.5" width="11" height="11" rx="3.5" fill="none" stroke="#fff" strokeWidth="1.4" />
          <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.4" />
          <circle cx="16" cy="8" r="0.9" fill="#fff" />
        </svg>
      );
    case 'Trustpilot':
      return (
        <svg {...common}>
          <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#00B67A" />
          <path fill="#fff" d="M12 5.5 14 10h4.5l-3.6 2.8 1.4 4.7L12 14.8l-4.3 2.7 1.4-4.7L5.5 10H10z" />
        </svg>
      );
    case 'LinkedIn':
      return (
        <svg {...common}>
          <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="#0A66C2" />
          <circle cx="8" cy="8.2" r="1.4" fill="#fff" />
          <rect x="6.8" y="10.5" width="2.4" height="7" fill="#fff" />
          <path
            fill="#fff"
            d="M11.8 10.5h2.3v1c.5-.75 1.3-1.2 2.4-1.2 1.9 0 3 1.25 3 3.6v3.6h-2.4v-3.2c0-1.05-.4-1.7-1.3-1.7-.85 0-1.4.6-1.6 1.2-.07.2-.1.45-.1.75v2.95h-2.3v-7Z"
          />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11.25" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1.3" />
          <ellipse cx="12" cy="12" rx="5" ry="11.25" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1.3" />
          <path d="M0.75 12h22.5M2.6 7h18.8M2.6 17h18.8" stroke="rgba(0,0,0,0.6)" strokeWidth="1.3" />
        </svg>
      );
  }
}
