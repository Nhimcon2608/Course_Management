'use client';

import React from 'react';

interface LogoProps {
  className?: string;
}

// Tech Company Logos
export const GoogleLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M61.44 20.4c0-1.2-.1-2.35-.29-3.46H31.6v6.55h16.73c-.72 3.88-2.91 7.17-6.2 9.37v7.76h10.04c5.87-5.4 9.27-13.36 9.27-20.22z" fill="#4285F4"/>
    <path d="M31.6 42.4c8.38 0 15.4-2.78 20.53-7.52l-10.04-7.76c-2.78 1.86-6.33 2.96-10.49 2.96-8.07 0-14.9-5.45-17.34-12.78H4.1v8.02C9.2 35.09 19.76 42.4 31.6 42.4z" fill="#34A853"/>
    <path d="M14.26 24.3c-.62-1.86-.97-3.84-.97-5.9s.35-4.04.97-5.9V4.48H4.1C1.49 9.7 0 14.65 0 20s1.49 10.3 4.1 15.52l10.16-7.22z" fill="#FBBC04"/>
    <path d="M31.6 7.92c4.55 0 8.64 1.56 11.86 4.62l8.9-8.9C47 1.49 39.98-1.6 31.6-1.6 19.76-1.6 9.2 5.71 4.1 15.48l10.16 7.22c2.44-7.33 9.27-12.78 17.34-12.78z" fill="#EA4335"/>
    <text x="70" y="25" className="fill-gray-700 text-sm font-semibold">Google</text>
  </svg>
);

export const MicrosoftLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="14" height="14" fill="#F25022"/>
    <rect x="22" y="4" width="14" height="14" fill="#7FBA00"/>
    <rect x="4" y="22" width="14" height="14" fill="#00A4EF"/>
    <rect x="22" y="22" width="14" height="14" fill="#FFB900"/>
    <text x="45" y="25" className="fill-gray-700 text-sm font-semibold">Microsoft</text>
  </svg>
);

export const AmazonLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.31 30.31c-5.27 0-9.85-1.95-13.74-5.84l2.12-2.12c3.18 3.18 6.89 4.77 11.62 4.77 2.65 0 4.89-.53 6.72-1.59 1.83-1.06 2.74-2.44 2.74-4.14 0-1.7-.53-3.01-1.59-3.93-1.06-.92-2.65-1.38-4.77-1.38h-3.18v-3.18h3.18c1.83 0 3.18-.39 4.06-1.17.88-.78 1.32-1.83 1.32-3.15 0-1.32-.44-2.37-1.32-3.15-.88-.78-2.23-1.17-4.06-1.17-4.14 0-7.42 1.32-9.84 3.96L11.45 6.2c3.18-3.18 7.42-4.77 12.73-4.77 3.18 0 5.84.78 7.98 2.34 2.14 1.56 3.21 3.7 3.21 6.42 0 2.72-1.07 4.86-3.21 6.42 2.14 1.56 3.21 3.7 3.21 6.42 0 2.72-1.07 4.86-3.21 6.42-2.14 1.56-4.8 2.34-7.98 2.34z" fill="#FF9900"/>
    <path d="M8.5 35.5c15.5 5.5 32.5 5.5 48 0" stroke="#FF9900" strokeWidth="2" strokeLinecap="round"/>
    <text x="45" y="25" className="fill-gray-700 text-sm font-semibold">Amazon</text>
  </svg>
);

export const MetaLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8zm0 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" fill="#1877F2"/>
    <circle cx="20" cy="20" r="4" fill="#1877F2"/>
    <text x="45" y="25" className="fill-gray-700 text-sm font-semibold">Meta</text>
  </svg>
);

// University Logos
export const StanfordLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="24" height="24" rx="2" fill="#8C1515"/>
    <text x="12" y="22" className="fill-white text-xs font-bold">S</text>
    <text x="40" y="25" className="fill-gray-700 text-sm font-semibold">Stanford</text>
  </svg>
);

export const MITLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="24" height="24" rx="2" fill="#A31F34"/>
    <text x="11" y="22" className="fill-white text-xs font-bold">MIT</text>
    <text x="40" y="25" className="fill-gray-700 text-sm font-semibold">MIT</text>
  </svg>
);

export const HarvardLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="24" height="24" rx="2" fill="#A51C30"/>
    <text x="12" y="22" className="fill-white text-xs font-bold">H</text>
    <text x="40" y="25" className="fill-gray-700 text-sm font-semibold">Harvard</text>
  </svg>
);

export const BerkeleyLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="24" height="24" rx="2" fill="#003262"/>
    <text x="10" y="22" className="fill-white text-xs font-bold">UCB</text>
    <text x="40" y="25" className="fill-gray-700 text-sm font-semibold">UC Berkeley</text>
  </svg>
);

// Startup Logos
export const StripeLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 15c-2.5 0-4 1.5-4 3.5s1.5 3.5 4 3.5 4-1.5 4-3.5-1.5-3.5-4-3.5zm0 5c-1 0-1.5-.5-1.5-1.5s.5-1.5 1.5-1.5 1.5.5 1.5 1.5-.5 1.5-1.5 1.5z" fill="#635BFF"/>
    <rect x="8" y="24" width="24" height="2" fill="#635BFF"/>
    <text x="40" y="25" className="fill-gray-700 text-sm font-semibold">Stripe</text>
  </svg>
);

export const AirbnbLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8c-3 0-5.5 2.5-5.5 5.5 0 4.5 5.5 10.5 5.5 10.5s5.5-6 5.5-10.5c0-3-2.5-5.5-5.5-5.5zm0 7.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#FF5A5F"/>
    <text x="40" y="25" className="fill-gray-700 text-sm font-semibold">Airbnb</text>
  </svg>
);

export const UberLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="12" fill="#000"/>
    <circle cx="20" cy="20" r="6" fill="#fff"/>
    <text x="40" y="25" className="fill-gray-700 text-sm font-semibold">Uber</text>
  </svg>
);

export const SpotifyLogo: React.FC<LogoProps> = ({ className = "w-24 h-12" }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="12" fill="#1DB954"/>
    <path d="M14 16c2 0 4 .5 6 1.5M14 20c2 0 4 .5 6 1.5M16 24c1.5 0 3 .3 4 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    <text x="40" y="25" className="fill-gray-700 text-sm font-semibold">Spotify</text>
  </svg>
);

// Logo mapping for easy access
export const partnerLogos = {
  tech: {
    Google: GoogleLogo,
    Microsoft: MicrosoftLogo,
    Amazon: AmazonLogo,
    Meta: MetaLogo,
  },
  university: {
    Stanford: StanfordLogo,
    MIT: MITLogo,
    Harvard: HarvardLogo,
    'UC Berkeley': BerkeleyLogo,
  },
  startup: {
    Stripe: StripeLogo,
    Airbnb: AirbnbLogo,
    Uber: UberLogo,
    Spotify: SpotifyLogo,
  }
};
