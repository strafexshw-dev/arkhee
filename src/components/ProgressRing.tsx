import { useId } from "react";
import type { ReactNode } from "react";

/**
 * Anel de progresso arcano: o número cede lugar ao símbolo.
 * O miolo recebe qualquer conteúdo (normalmente o numeral da fase).
 */
export function ProgressRing({
  progress,
  size = 112,
  label,
  children,
}: {
  progress: number;
  size?: number;
  label: string;
  children?: ReactNode;
}) {
  const rawId = useId();
  const gradientId = `ring-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const stroke = 3;
  const radius = size / 2 - stroke - 4;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      {/* órbita decorativa */}
      <div
        className="orbit-slow pointer-events-none absolute rounded-full border border-dashed border-border"
        style={{ inset: -7 }}
        aria-hidden
      />
      <div
        className="pulse-slow pointer-events-none absolute rounded-full bg-primary/12 blur-xl"
        style={{ inset: 8 }}
        aria-hidden
      />

      <svg width={size} height={size} className="relative -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.88 0.11 92)" />
            <stop offset="100%" stopColor="oklch(0.74 0.15 62)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ transition: "stroke-dashoffset 700ms var(--ease-arcane)" }}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
