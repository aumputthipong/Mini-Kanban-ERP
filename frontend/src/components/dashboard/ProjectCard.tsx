import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Board } from "@/types/board";

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

interface ProjectCardProps {
  board: Board;
  viewMode: "grid" | "list";
}

export function ProjectCard({ board, viewMode }: ProjectCardProps) {
  const progress =
    board.total_cards > 0
      ? Math.round((board.done_cards / board.total_cards) * 100)
      : 0;

  const isActive =
    Date.now() - new Date(board.updated_at).getTime() <
    7 * 24 * 60 * 60 * 1000;

  const visibleMembers = board.members.slice(0, 3);
  const extraCount = board.members.length - visibleMembers.length;

  const updatedLabel = board.updated_at
    ? formatDistanceToNow(new Date(board.updated_at), { addSuffix: true })
    : null;

  if (viewMode === "list") {
    return (
      <Link href={`/board/${board.id}/tasks`}>
        <div className="bg-white px-5 py-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 flex items-center gap-4 group">
          {/* title + updated */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate">
              {board.title}
            </h2>
            {updatedLabel && (
              <p className="text-xs text-slate-400 mt-0.5">
                Updated {updatedLabel}
              </p>
            )}
          </div>

          {/* progress bar */}
          <div className="w-32 shrink-0">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* task count */}
          <div className="text-xs text-slate-500 shrink-0 w-20 text-right">
            <span className="text-slate-700 font-semibold">
              {board.total_cards}
            </span>{" "}
            Tasks
          </div>

          {/* avatar stack */}
          <div className="flex -space-x-2 shrink-0">
            {visibleMembers.map((m) => (
              <div
                key={m.user_id}
                title={m.full_name}
                className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white ${getAvatarColor(m.full_name)}`}
              >
                {getInitials(m.full_name)}
              </div>
            ))}
            {extraCount > 0 && (
              <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 ring-2 ring-white">
                +{extraCount}
              </div>
            )}
          </div>

          {/* status badge */}
          <span
            className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </Link>
    );
  }

  // grid view
  return (
    <Link href={`/board/${board.id}/tasks`}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group h-48">
        {/* header */}
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-base font-bold text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">
            {board.title}
          </h2>
          <span
            className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {updatedLabel && (
          <p className="text-xs text-slate-400 mt-1">Updated {updatedLabel}</p>
        )}

        {/* progress */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* footer */}
        <div className="flex justify-between items-center mt-3">
          {/* avatar stack */}
          <div className="flex -space-x-2">
            {visibleMembers.map((m) => (
              <div
                key={m.user_id}
                title={m.full_name}
                className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white ${getAvatarColor(m.full_name)}`}
              >
                {getInitials(m.full_name)}
              </div>
            ))}
            {extraCount > 0 && (
              <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 ring-2 ring-white">
                +{extraCount}
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            <span className="text-slate-600 font-bold">{board.total_cards}</span> Tasks
          </div>
        </div>
      </div>
    </Link>
  );
}
