"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import type { Board } from "@/types/board";
import { ProjectCard } from "./ProjectCard";

type SortOption = "updated" | "name_asc" | "name_desc" | "most_tasks";

const SORT_LABELS: Record<SortOption, string> = {
  updated: "Recently Updated",
  name_asc: "Name A→Z",
  name_desc: "Name Z→A",
  most_tasks: "Most Tasks",
};

function sortBoards(boards: Board[], sortBy: SortOption): Board[] {
  return [...boards].sort((a, b) => {
    switch (sortBy) {
      case "updated":
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      case "name_asc":
        return a.title.localeCompare(b.title);
      case "name_desc":
        return b.title.localeCompare(a.title);
      case "most_tasks":
        return b.total_cards - a.total_cards;
    }
  });
}

interface BoardsClientProps {
  boards: Board[];
}

export function BoardsClient({ boards }: BoardsClientProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const matching = q
      ? boards.filter((b) => b.title.toLowerCase().includes(q))
      : boards;
    return sortBoards(matching, sortBy);
  }, [boards, search, sortBy]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="text-sm rounded-lg border border-slate-200 bg-white text-slate-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-2 transition-colors ${
              viewMode === "grid"
                ? "bg-blue-50 text-blue-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-2 border-l border-slate-200 transition-colors ${
              viewMode === "list"
                ? "bg-blue-50 text-blue-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">No projects found</p>
        </div>
      )}

      {/* Cards */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filtered.map((board) => (
            <ProjectCard key={board.id} board={board} viewMode="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((board) => (
            <ProjectCard key={board.id} board={board} viewMode="list" />
          ))}
        </div>
      )}
    </div>
  );
}
