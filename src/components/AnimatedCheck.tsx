/**
 * Marcação de evidência: o círculo e o traço são desenhados no momento em que
 * o hábito é marcado, e o brilho some quando é desmarcado.
 */
export function AnimatedCheck({ checked }: { checked: boolean }) {
  return (
    <span className="relative grid size-6 shrink-0 place-items-center" aria-hidden>
      {checked && (
        <span className="pulse-slow absolute inset-0 rounded-full bg-primary/25 blur-md" />
      )}
      <svg viewBox="0 0 24 24" fill="none" className="relative size-6">
        <circle
          cx="12"
          cy="12"
          r="10.25"
          pathLength={1}
          strokeWidth={1.5}
          stroke={checked ? "var(--primary)" : "var(--edge)"}
          fill={checked ? "var(--ember-soft)" : "none"}
          className={checked ? "draw-ring" : undefined}
        />
        {checked && (
          <path
            d="M7.6 12.5l2.9 2.9 6-6.7"
            pathLength={1}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="var(--primary)"
            className="draw-check"
          />
        )}
      </svg>
    </span>
  );
}
