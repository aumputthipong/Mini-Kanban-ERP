// components/layout/Navbar.tsx
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export function Navbar() {
  return (
    <header className="h-14 border-b border-slate-200 bg-white shrink-0">
      <nav className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10 overflow-hidden rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
              <Image
                src="/Turtask.png"
                alt="Turtask Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">
              Turtask.
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:text-slate-900 transition-colors"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link
            href="/projects"
            className="hover:text-slate-900 transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/trash"
            className="hover:text-slate-900 transition-colors"
          >
            Trash
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
