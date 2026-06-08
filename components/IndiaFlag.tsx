// Decorative Indian-flag icon for the navbar brand. Original SVG (a national
// flag's geometry isn't copyrightable). aria-hidden — the "GovSchemes India"
// text already conveys the branding, so screen readers should not announce it.
// 3:2 ratio; sized in CSS (.brand-flag) so it never grows the navbar.
export default function IndiaFlag() {
  // 24-spoke Ashoka Chakra, centred at (18,12), radius 3 (one path, all spokes).
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 * Math.PI) / 180;
    const x = (18 + 3 * Math.cos(a)).toFixed(2);
    const y = (12 + 3 * Math.sin(a)).toFixed(2);
    return `M18 12 L${x} ${y}`;
  }).join(' ');

  return (
    <svg className="brand-flag" viewBox="0 0 36 24" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="indiaFlagRound">
          <rect width="36" height="24" rx="2.5" />
        </clipPath>
      </defs>
      <g clipPath="url(#indiaFlagRound)">
        <rect width="36" height="8" fill="#FF9933" />
        <rect y="8" width="36" height="8" fill="#FFFFFF" />
        <rect y="16" width="36" height="8" fill="#138808" />
        <circle cx="18" cy="12" r="3.2" fill="none" stroke="#000080" strokeWidth="0.5" />
        <path d={spokes} stroke="#000080" strokeWidth="0.3" fill="none" />
        <circle cx="18" cy="12" r="0.8" fill="#000080" />
      </g>
      <rect
        x="0.25"
        y="0.25"
        width="35.5"
        height="23.5"
        rx="2.4"
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="0.5"
      />
    </svg>
  );
}
