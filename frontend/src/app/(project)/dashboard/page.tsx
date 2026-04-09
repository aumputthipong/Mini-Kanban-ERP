import { CreateBoardButton } from "@/components/CreateBoardButton";
import { BoardsClient } from "@/components/dashboard/BoardsClient";
import { apiFetch } from "@/lib/api";
import { Board } from "@/types/board";

export default async function DashboardPage() {
  const boards = await apiFetch<Board[]>("/boards", { cache: "no-store" });

  return (
    <main className="h-full overflow-y-auto p-10 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            My Projects
          </h1>
          <CreateBoardButton />
        </div>

        <BoardsClient boards={boards} />
      </div>
    </main>
  );
}
