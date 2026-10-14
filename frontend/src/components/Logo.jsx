export function Logo({ size = 30, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="rxai-logo-grad"
          x1="3"
          y1="3"
          x2="29"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#38e1f5" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="#060818" />
      <g transform="translate(3.5 3.5) scale(0.78)">
        <circle cx="16" cy="16" r="12.5" stroke="url(#rxai-logo-grad)" strokeWidth="2.6" />
        <path
          d="M5 17h5l2.5-6 3.5 12 2.5-8 1.5 2H27"
          stroke="url(#rxai-logo-grad)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}