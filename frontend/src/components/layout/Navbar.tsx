// components/layout/Navbar.tsx
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { LogoutButton } from "./LogoutButton";

export async function Navbar() {
  const session = await getSession();

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
                sizes="(max-width: 768px) 80px, 96px"
                className="object-cover"
                priority
              />
            </div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">
              Turtask.
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            // ล็อกอินอยู่
            <>
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {session.email.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{session.email}</span>
              </div>

              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Dashboard
              </Link>

              <LogoutButton />
            </>
          ) : (
            // ยังไม่ล็อกอิน
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
