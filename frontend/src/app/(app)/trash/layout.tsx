// app/(project)/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { apiFetch } from "@/lib/api";
import { API_URL } from "@/lib/constants";
import { Board } from "@/types/board";


async function getBoards(): Promise<Board[]> {
  const boards = await apiFetch<Board[]>("/boards");
  try {
    const res = await fetch(`${API_URL}/boards`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}


export default async function ProjectLayout({ children }: { children: React.ReactNode }) {
  const boards = await getBoards();

  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar boards={boards} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
