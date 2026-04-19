import { type ReactNode } from 'react';
import { Link } from 'react-router';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0068FF] opacity-8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#3B82F6] opacity-8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0068FF] opacity-[0.03] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-[0.25rem] shadow-lg shadow-[#0068FF]/8 p-8 my-2">
          <div className="flex items-center justify-center gap-3 pb-6">
            <Link to="/" className="inline-flex items-center gap-3 no-underline">
              <img src="/logo.svg" alt="Kapta Logo" className="w-12 h-12" />
              <span className="text-2xl font-bold text-[#0068FF]">Kapta</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
