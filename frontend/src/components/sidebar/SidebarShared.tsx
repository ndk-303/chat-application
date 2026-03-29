// ─── Shared UI primitives for Sidebar panels ─────────────────────────────────
import { Loader2 } from 'lucide-react';

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
      <Loader2 className="animate-spin text-[#0068FF]" size={22} />
    </div>
  );
}
