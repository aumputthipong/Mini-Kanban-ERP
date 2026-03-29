// components/layout/Navbar.tsx
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export function Navbar() {
  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center px-6 shrink-0">
      <nav className="w-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex space-x-4">
        <Link
          href="/"
          className="text-xl font-extrabold text-slate-900 tracking-tighter"
          >
          MiniERP.
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>
          </div>
      <div className="space-x-4">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
          Sign In
        </Link>
        <Link
          href="/dashboard"
          className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
          >
          Get Started
        </Link>
    
          </div>
      </nav>
    </header>
  );
}