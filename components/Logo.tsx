/**
 * Marshmallow Tech robot logo, recreated as scalable SVG so it stays sharp
 * everywhere (header, footer, and baked into the exported tier-list image).
 * Pass a unique `idSuffix` when rendering more than once on a page so the
 * gradient definitions don't collide.
 */
export default function Logo({
  className,
  idSuffix = "a",
  decorative = false,
}: {
  className?: string;
  idSuffix?: string;
  /** Set when adjacent text already names the brand, to avoid double announcement. */
  decorative?: boolean;
}) {
  const grad = `mt-grad-${idSuffix}`;
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Marshmallow Tech"}
      aria-hidden={decorative ? true : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b46d6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* Antennas */}
      <line x1="46" y1="42" x2="42" y2="22" stroke={`url(#${grad})`} strokeWidth="5" strokeLinecap="round" />
      <line x1="74" y1="42" x2="78" y2="22" stroke={`url(#${grad})`} strokeWidth="5" strokeLinecap="round" />
      <circle cx="41" cy="17" r="6.5" fill={`url(#${grad})`} />
      <circle cx="79" cy="17" r="6.5" fill={`url(#${grad})`} />

      {/* Ears */}
      <rect x="15" y="58" width="11" height="22" rx="5.5" fill={`url(#${grad})`} />
      <rect x="94" y="58" width="11" height="22" rx="5.5" fill={`url(#${grad})`} />

      {/* Head */}
      <rect x="24" y="42" width="72" height="56" rx="15" fill="none" stroke={`url(#${grad})`} strokeWidth="7" />

      {/* Screen shadow + screen */}
      <rect x="37" y="57" width="46" height="34" rx="8" fill="#000" opacity="0.12" />
      <rect x="37" y="54" width="46" height="34" rx="8" fill="#ffffff" stroke="#2b2b2b" strokeWidth="1.4" />

      {/* X eyes */}
      <g stroke="#2b2b2b" strokeWidth="5.5" strokeLinecap="round">
        <line x1="49" y1="66" x2="57" y2="76" />
        <line x1="57" y1="66" x2="49" y2="76" />
        <line x1="63" y1="66" x2="71" y2="76" />
        <line x1="71" y1="66" x2="63" y2="76" />
      </g>
    </svg>
  );
}
