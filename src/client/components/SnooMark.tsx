export type SnooMarkProps = {
  className?: string;
};

/**
 * Static SVG twin of the in-game Snoo used by the feed preview card.
 * Kept inline so the splash entrypoint stays image-free and instant.
 */
export const SnooMark = ({ className }: SnooMarkProps) => {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Snoo mascot"
      className={className}
    >
      <path
        d="M32.5 21.5c2.2-4.6 5-8 8.6-10.5"
        fill="none"
        stroke="#E5EBEE"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="41.5" cy="9.5" r="4.6" fill="#FF4500" />
      <circle cx="40" cy="7.9" r="1.5" fill="#FFFFFF" fillOpacity="0.85" />

      <circle cx="13.5" cy="33" r="5.2" fill="#FFFFFF" stroke="#E5EBEE" strokeWidth="1.4" />
      <circle cx="50.5" cy="33" r="5.2" fill="#FFFFFF" stroke="#E5EBEE" strokeWidth="1.4" />

      <ellipse cx="32" cy="34" rx="19.5" ry="14.5" fill="#FFFFFF" stroke="#E5EBEE" strokeWidth="1.5" />

      <ellipse cx="24.5" cy="32.5" rx="4.3" ry="5" fill="#FF4500" />
      <ellipse cx="39.5" cy="32.5" rx="4.3" ry="5" fill="#FF4500" />
      <circle cx="23.2" cy="30.6" r="1.4" fill="#FFFFFF" fillOpacity="0.9" />
      <circle cx="38.2" cy="30.6" r="1.4" fill="#FFFFFF" fillOpacity="0.9" />

      <path
        d="M26.5 38.5c1.6 1.9 3.4 2.8 5.5 2.8s3.9-0.9 5.5-2.8"
        fill="none"
        stroke="#0B1416"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
