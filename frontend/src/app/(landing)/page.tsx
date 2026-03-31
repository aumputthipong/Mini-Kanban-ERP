// app/(landing)/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  LayoutDashboard,
  Zap,
  CheckCircle2,
  MoreHorizontal,
  MessageSquare,
  Clock,
  Paperclip,
} from "lucide-react";
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
    <div className="flex-1 max-w-2xl z-10">
      {/* ส่วนโลโก้ Turtask (เหนือหัวข้อ) */}

      {/* หัวข้อ (Heading) */}
      <div className="flex items-center gap-4 md:gap-6 mb-6">
        {/* ส่วนโลโก้ (เพิ่มคลาส relative และ shrink-0 เพื่อไม่ให้รูปโดนบีบ) */}
        <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
          <Image
            src="/Turtask.png"
            alt="Turtask Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* หัวข้อ (Heading) เอา mb-6 ออกเพราะย้ายไปไว้ที่ตัว Wrapper ด้านบนแล้ว */}
        <h1 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
          TURTASK. <br />
        </h1>
      </div>

      <p className="text-4xl md:text-2xl text-slate-600 mb-10 max-w-xl leading-relaxed font-medium">
        Manage your work tasks and hit your goals together."{" "}
      </p>

      {/* ปุ่ม Call to Action */}
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

function PreviewKanbanBoard() {
  return (
    <div className="flex-1 relative w-full max-w-lg lg:h-[550px] flex items-center justify-center z-10 mt-12 lg:mt-0">
      {/* พื้นหลังตกแต่งให้ดูมีมิติ */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[3rem] transform rotate-3 scale-105 opacity-50 pointer-events-none" />

      {/* Mockup Kanban Column */}
      <div className="relative w-full max-w-sm bg-slate-100/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/60 flex flex-col gap-4">
        {/* Column Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">In Progress</h3>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
              2
            </span>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Task Card 1 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-amber-200">
              High Priority
            </span>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-blue-100">
              Design
            </span>
          </div>

          <h4 className="font-bold text-slate-800 leading-snug">
            Design Landing Page Hero Section
          </h4>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1 text-xs font-medium">
                <Clock size={14} /> 2 days left
              </span>
              <span className="flex items-center gap-1 text-xs font-medium">
                <MessageSquare size={14} /> 4
              </span>
            </div>
            {/* Mock Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-[10px] font-bold">
              PC
            </div>
          </div>
        </div>

        {/* Task Card 2 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-emerald-100">
              Backend
            </span>
          </div>

          <h4 className="font-bold text-slate-800 leading-snug">
            Setup PostgreSQL Schema
          </h4>

          {/* Progress Bar Mockup */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Subtasks
              </span>
              <span>2/3</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-emerald-500 rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1 text-xs font-medium">
                <Paperclip size={14} /> 1
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 border-2 border-white shadow-sm flex items-center justify-center text-white text-[10px] font-bold">
              AM
            </div>
          </div>
        </div>
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
        <PreviewKanbanBoard />
      </main>
    </div>
  );
}
