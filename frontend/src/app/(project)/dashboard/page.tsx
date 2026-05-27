import { CreateBoardButton } from "@/components/CreateBoardButton";
import { BoardsClient } from "@/components/project-list/BoardsClient";
import { apiFetch } from "@/lib/api";
import { Board } from "@/types/board";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const boards = await apiFetch<Board[]>("/boards", { cache: "no-store" });
  const now = Date.now();
  const activeCount = boards.filter(
    (b) =>
      now - new Date(b.last_accessed_at ?? b.updated_at).getTime() <
      SEVEN_DAYS_MS,
  ).length;
  const inactiveCount = boards.length - activeCount;

  return (
    <main className="h-full overflow-y-auto p-10 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
              My Projects
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {boards.length} {boards.length === 1 ? "project" : "projects"}
              <span className="mx-1.5 text-slate-300">·</span>
              <span className="text-emerald-700 font-semibold">
                {activeCount} active
              </span>
              <span className="mx-1.5 text-slate-300">·</span>
              <span className="text-slate-500">{inactiveCount} inactive</span>
            </p>
          </div>
          <CreateBoardButton />
        </div>

        <BoardsClient boards={boards} />
      </div>
    </main>
  );
}
