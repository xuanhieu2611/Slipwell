export function SlipwellMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="Slipwell">
      <span
        className="relative grid size-9 shrink-0 place-items-center rounded-[14px] bg-[var(--ink)] text-sm font-black text-[var(--paper)] shadow-[0_6px_16px_rgba(23,24,20,0.16)]"
        aria-hidden="true"
      >
        <span className="absolute left-[8px] top-[9px] h-[3px] w-5 -rotate-12 rounded-full bg-[var(--lime)]" />
        <span className="absolute left-[8px] top-[16px] h-[3px] w-4 -rotate-12 rounded-full bg-[var(--coral)]" />
        <span className="absolute left-[8px] top-[23px] h-[3px] w-3 -rotate-12 rounded-full bg-[var(--blue)]" />
      </span>
      {compact ? null : (
        <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.035em]">
          slipwell
        </span>
      )}
    </div>
  );
}
