// ─── Shared UI primitives for Sidebar panels ─────────────────────────────────

export function Avatar({ src, name, size = 10 }: { src?: string | null; name?: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full bg-[#0068FF]/10 flex items-center justify-center text-[#0068FF] font-semibold text-sm shrink-0 overflow-hidden`;
  return (
    <div className={cls}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : (name?.[0] ?? '?').toUpperCase()
      }
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <svg className="animate-spin text-[#0068FF]" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
