const SIZE = 140;
const STROKE = 12;

function colorFor(value) {
  if (value >= 85) return "#ef4444";
  if (value >= 60) return "#f59e0b";
  return "#22c55e";
}

export default function GaugeBar({ value = 0, label, size = SIZE }) {
  const hasValue = Number.isFinite(Number(value)) && value !== null;
  const safeValue = hasValue ? Math.min(100, Math.max(0, Number(value))) : 0;
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safeValue / 100);
  const color = hasValue ? colorFor(safeValue) : "#475569";

  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 6 }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${safeValue}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={STROKE}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 500ms ease, stroke 300ms ease" }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize={size * 0.18}
          fontWeight={700}
        >
          {hasValue ? `${Math.round(safeValue)}%` : "—"}
        </text>
      </svg>
      <span style={{ color: "#94a3b8", fontSize: 13, letterSpacing: "0.04em" }}>
        {label}
      </span>
    </div>
  );
}
