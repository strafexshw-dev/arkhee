/**
 * Poeira arcanas: partículas lentas + dois véus de luz que dão profundidade
 * sem competir com o conteúdo. Puramente decorativo (pointer-events-none,
 * aria-hidden) e desligado por prefers-reduced-motion no CSS global.
 */

type Mote = {
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  tone: "ember" | "arcane";
};

const MOTES: Mote[] = [
  { top: "8%", left: "6%", size: 3, delay: "0s", duration: "16s", tone: "ember" },
  { top: "18%", left: "82%", size: 2, delay: "-3s", duration: "19s", tone: "arcane" },
  { top: "31%", left: "14%", size: 2, delay: "-7s", duration: "22s", tone: "arcane" },
  { top: "42%", left: "91%", size: 3, delay: "-2s", duration: "17s", tone: "ember" },
  { top: "55%", left: "5%", size: 2, delay: "-11s", duration: "24s", tone: "ember" },
  { top: "63%", left: "76%", size: 2, delay: "-5s", duration: "20s", tone: "arcane" },
  { top: "74%", left: "22%", size: 3, delay: "-9s", duration: "18s", tone: "arcane" },
  { top: "84%", left: "64%", size: 2, delay: "-14s", duration: "23s", tone: "ember" },
  { top: "12%", left: "46%", size: 2, delay: "-6s", duration: "21s", tone: "arcane" },
  { top: "26%", left: "62%", size: 2, delay: "-16s", duration: "26s", tone: "ember" },
  { top: "48%", left: "34%", size: 2, delay: "-4s", duration: "19s", tone: "ember" },
  { top: "68%", left: "48%", size: 3, delay: "-12s", duration: "25s", tone: "arcane" },
  { top: "90%", left: "12%", size: 2, delay: "-8s", duration: "20s", tone: "arcane" },
  { top: "36%", left: "72%", size: 2, delay: "-18s", duration: "27s", tone: "ember" },
];

export function AmbientField() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* véus de luz */}
      <div className="pulse-slow absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
      <div className="pulse-slow absolute -bottom-40 -right-24 size-[28rem] rounded-full bg-primary/8 blur-[120px]" />

      {/* poeira */}
      {MOTES.map((mote) => (
        <span
          key={`${mote.top}-${mote.left}`}
          className="float-slow absolute rounded-full"
          style={{
            top: mote.top,
            left: mote.left,
            width: mote.size,
            height: mote.size,
            animationDelay: mote.delay,
            animationDuration: mote.duration,
            backgroundColor: mote.tone === "ember" ? "var(--ember)" : "var(--arcane)",
            opacity: mote.size > 2 ? 0.4 : 0.26,
            boxShadow:
              mote.tone === "ember"
                ? "0 0 8px oklch(0.83 0.14 80 / 55%)"
                : "0 0 8px oklch(0.66 0.17 300 / 50%)",
          }}
        />
      ))}
    </div>
  );
}
