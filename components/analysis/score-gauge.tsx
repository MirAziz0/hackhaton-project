"use client";

import { useT } from "@/components/i18n/locale-provider";

const RADIUS = 80;
const STROKE = 16;
const ARC_LENGTH = Math.PI * RADIUS;

function band(score: number) {
  if (score >= 70) return { color: "#059669", label: "Yüksək hazırlıq" };
  if (score >= 40) return { color: "#d97706", label: "Orta hazırlıq" };
  return { color: "#dc2626", label: "Aşağı hazırlıq" };
}

// Half-circle gauge for the 0-100 investment readiness score.
export function ScoreGauge({ score }: { score: number }) {
  const t = useT();
  const clamped = Math.min(100, Math.max(0, score));
  const { color, label: bandLabel } = band(clamped);
  const label = t(bandLabel);
  const arc = `M ${100 - RADIUS} 100 A ${RADIUS} ${RADIUS} 0 0 1 ${100 + RADIUS} 100`;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 116"
        className="w-full max-w-64"
        role="img"
        aria-label={t("İnvestisiyaya hazırlıq balı: 100-dən {score}. {label}.", { score: clamped, label })}
      >
        <path d={arc} fill="none" stroke="var(--muted)" strokeWidth={STROKE} strokeLinecap="round" />
        <path
          d={arc}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * ARC_LENGTH} ${ARC_LENGTH}`}
        />
        <text x="100" y="92" textAnchor="middle" fontSize="46" fontWeight="700" fill="var(--foreground)">
          {clamped}
        </text>
        <text x="100" y="112" textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">
          / 100
        </text>
      </svg>
      <p className="mt-2 flex items-center gap-2 text-sm font-medium">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </p>
    </div>
  );
}
