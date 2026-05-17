import { Skeleton } from "@/components/ui/Skeleton";

export function MyTasksSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Status cards */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2.5"
          >
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 flex-1 ml-auto" />
          </div>
        ))}
      </div>

      {/* Meta line */}
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-200">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>

      {/* Task rows */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-3 border border-slate-200 rounded-lg"
          >
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1 max-w-md" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
