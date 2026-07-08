export default function Logo({ size = 48 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Weatherly logo"
    >
      <g stroke="#E8A33D" strokeWidth="2.2" strokeLinecap="round">
        <line x1="19" y1="1.5" x2="19" y2="5" />
        <line x1="31.5" y1="5.5" x2="29" y2="8" />
        <line x1="35.5" y1="17" x2="32" y2="17" />
      </g>
      <circle cx="19" cy="17" r="9.5" fill="#E8A33D" />
      <path
        d="M13.5 34.5c-3.6 0-6.5-2.9-6.5-6.5 0-3.3 2.4-6 5.6-6.4C13.6 18 17.5 15 22 15c5.1 0 9.4 3.6 10.4 8.4 3.3.3 5.9 3.1 5.9 6.6 0 3.6-2.9 6.5-6.5 6.5h-18.3z"
        fill="#FFFFFF"
        stroke="#3E7CB1"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
