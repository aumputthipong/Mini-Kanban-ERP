"use client";

export type TabType = "kanban" | "dashboard";

interface BoardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BoardTabs({ activeTab, onTabChange }: BoardTabsProps) {
  return (
    <div className="flex gap-6 mb-6 border-b border-slate-200">
      <button
        onClick={() => onTabChange("kanban")}
        className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
          activeTab === "kanban"
            ? "border-slate-800 text-slate-800"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Kanban Board
      </button>
      <button
        onClick={() => onTabChange("dashboard")}
        className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
          activeTab === "dashboard"
            ? "border-slate-800 text-slate-800"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Dashboard Overview
      </button>
    </div>
  );
}