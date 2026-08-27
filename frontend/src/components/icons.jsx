const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  className: 'w-6 h-6',
};

export const HomeIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

export const MapPinIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 21s-7-5.3-7-11a7 7 0 1 1 14 0c0 5.7-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const StarIcon = (props) => (
  <svg {...base} {...props}>
    <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z" />
  </svg>
);

export const WalletIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="M3 10h18" />
    <path d="M16 14.5h2" />
  </svg>
);

export const ScanIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
    <path d="M8 10h8v4H8z" />
  </svg>
);

export const PackageIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
    <path d="M4 7l8 4 8-4M12 11v10" />
  </svg>
);

export const RouteIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="5" cy="19" r="2.5" />
    <circle cx="19" cy="5" r="2.5" />
    <path d="M7.5 19h7a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7h2" />
  </svg>
);

export const TagIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 3h8l10 10-8 8L3 11V3Z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </svg>
);

export const CartIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="17" cy="20" r="1.5" />
    <path d="M3 4h2l2.2 11h11l2-8H6.5" />
  </svg>
);

export const ShareIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" />
  </svg>
);

export const BellIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export const ArrowRightIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

export const CheckIcon = (props) => (
  <svg {...base} {...props}>
    <path d="m4 12 5 5L20 6" />
  </svg>
);

export const CloseIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const LogoutIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);
