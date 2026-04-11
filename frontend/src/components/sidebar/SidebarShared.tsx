import { Loader2, Search } from 'lucide-react';
import type { ReactNode } from 'react';

interface PanelHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PanelHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm…',
  actions,
  children,
}: PanelHeaderProps) {
  return (
    <div className={`p-3 border-b border-[#E5E7EB] ${children ? 'space-y-3' : 'space-y-0'}`}>
      {/* Search + Actions row */}
      <div className="flex items-center gap-2">
        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0068FF] transition-colors">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="block w-full pl-9 pr-3 py-2 bg-[#0068FF]/5 border-transparent focus:ring-1 focus:ring-[#0068FF] focus:bg-white rounded-[0.25rem] text-xs transition-all outline-none placeholder:text-slate-400"
          />
        </div>
        {actions}
      </div>

      {/* Optional slot (tabs, filters…) */}
      {children}
    </div>
  );
}


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
