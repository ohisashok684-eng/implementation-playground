import { useMemo } from 'react';

interface VolcanoIconProps {
  value: number;
}

const VolcanoIcon = ({ value }: VolcanoIconProps) => {
  const fillHeight = (value / 10) * 100;
  const uniqueId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  return (
    <svg width="40" height="40" viewBox="0 0 100 100" className="drop-shadow-sm shrink-0">
      <defs>
        <clipPath id={`clip-volcano-${uniqueId}`}>
          <path d="M50 5 L75 40 L90 90 Q90 95 85 95 L15 95 Q10 95 10 90 L25 40 Z" />
        </clipPath>
      </defs>
      {/* Fill based on value */}
      <rect
        x="0"
        y={100 - fillHeight}
        width="100"
        height={fillHeight}
        fill="#D9FF5F"
        clipPath={`url(#clip-volcano-${uniqueId})`}
        className="transition-all duration-500"
      />
      {/* Volcano outline */}
      <path
        d="M50 5 L75 40 L90 90 Q90 95 85 95 L15 95 Q10 95 10 90 L25 40 Z"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="2"
      />
      {/* Crater */}
      <ellipse cx="50" cy="20" rx="10" ry="4" fill="#e2e8f0" />
    </svg>
  );
};

export default VolcanoIcon;
