// app/(landing)/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, Zap, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Home",
  description: "Real-time Kanban board for your team",
};

// --- Sub-components ---

function BackgroundGrid() {
  return (
    <div
      className="absolute inset-0 z-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }}
    />
  );
}

function HeroSection() {
  return (
    <div className="flex-1 max-w-2xl">
  

      <h1 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
        Manage work. <br />
        <span className="text-blue-600">Ship faster </span>
        together.
      </h1>

      <p className="text-lg text-slate-600 mb-10 max-w-xl leading-relaxed">
        Join your team in a real-time Kanban board that keeps everyone aligned
        and productive — no distractions, just pure efficiency.
      </p>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
      >
        Go to Workspace
        <ArrowRight size={20} />
      </Link>
    </div>
  );
}

type ActivityItem =
  | {
      type: "task";
      label: string;
      color: string;
      avatars: { initial: string; bg: string }[];
    }
  | {
      type: "done";
      label: string;
    };

const activityItems: ActivityItem[] = [
  {
    type: "task",
    label: "Frontend Dev",
    color: "bg-blue-500",
    avatars: [
      { initial: "A", bg: "bg-pink-500" },
      { initial: "B", bg: "bg-emerald-500" },
    ],
  },
  {
    type: "task",
    label: "API Design",
    color: "bg-purple-500",
    avatars: [{ initial: "M", bg: "bg-orange-400" }],
  },
  {
    type: "done",
    label: "Database Setup",
  },
];

function ActivityRow({ item }: { item: ActivityItem }) {
  if (item.type === "done") {
    return (
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="font-semibold text-slate-400">{item.label}</span>
        </div>
        <CheckCircle2 size={20} className="text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${item.color}`} />
        <span className="font-semibold text-slate-700">{item.label}</span>
      </div>
      <div className="flex -space-x-2">
        {item.avatars.map((avatar) => (
          <div
            key={avatar.initial}
            className={`w-8 h-8 rounded-full ${avatar.bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
          >
            {avatar.initial}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="flex-1 relative w-full max-w-lg lg:h-[500px] flex items-center justify-center">
      <div className="relative z-10 w-full bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Right Now
            </p>
            <h3 className="text-xl font-bold text-slate-800">Team Activity</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            {/* <LayoutDashboard size={24} /> */}
          </div>
        </div>

        <div className="space-y-4">
          {activityItems.map((item) => (
            <ActivityRow key={item.label} item={item} />
          ))}
        </div>

        <button className="w-full mt-6 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          2 Boards Active
        </button>
      </div>
    </div>
  );
}

// --- Page ---

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] relative overflow-hidden font-sans">
      <BackgroundGrid />
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col lg:flex-row items-center justify-between gap-16">
        <HeroSection />
        <PreviewCard />
      </main>
    </div>
  );
}
