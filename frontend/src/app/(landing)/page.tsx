import Link from "next/link";
import { ArrowRight, LayoutDashboard, Zap, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] relative overflow-hidden font-sans">
      {/* Background Grid Pattern (คล้ายในภาพ Ref) */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Navbar อย่างง่าย */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="text-xl font-extrabold text-slate-900 tracking-tighter">
          MiniERP.
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

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col lg:flex-row items-center justify-between gap-16">
        {/* Left Content Section */}
        <div className="flex-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold tracking-wide uppercase mb-6 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Public Beta · Free to use
          </div>

          <h1 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            Manage work. <br />
            <span className="text-blue-600">Ship faster </span>
            together.
          </h1>

          <p className="text-lg text-slate-600 mb-10 max-w-xl leading-relaxed">
            Join your team in a real-time Kanban board that keeps everyone
            aligned and productive — no distractions, just pure efficiency.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
            >
              Go to Workspace
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Right Content Section (Floating UI Cards) */}
        <div className="flex-1 relative w-full max-w-lg lg:h-[500px] flex items-center justify-center">
          {/* Main Card */}
          <div className="relative z-10 w-full bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Right Now
                </p>
                <h3 className="text-xl font-bold text-slate-800">
                  Team Activity
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                <LayoutDashboard size={24} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="font-semibold text-slate-700">
                    Frontend Dev
                  </span>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    B
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="font-semibold text-slate-700">
                    API Design
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                  M
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  <span className="font-semibold text-slate-400">
                    Database Setup
                  </span>
                </div>
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>
            </div>

            <button className="w-full mt-6 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              2 Boards Active
            </button>
          </div>

          {/* Floating Tags (Decorative) */}
          <div
            className="absolute top-10 -left-12 bg-white px-4 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2 animate-bounce"
            style={{ animationDuration: "3s" }}
          >
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-sm font-bold text-slate-700">
              Sprint Planning
            </span>
          </div>

          <div
            className="absolute bottom-20 -right-8 bg-white px-4 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2 animate-bounce"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          >
            <Zap size={16} className="text-amber-500" />
            <span className="text-sm font-bold text-slate-700">Real-time</span>
          </div>
        </div>
      </main>
    </div>
  );
}
