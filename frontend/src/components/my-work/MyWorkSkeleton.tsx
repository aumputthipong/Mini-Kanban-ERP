import { Skeleton } from "@/components/ui/Skeleton";

export function MyWorkSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>

      {Array.from({ length: 2 }).map((_, gi) => (
        <div key={gi}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            {Array.from({ length: 3 }).map((_, ri) => (
              <div
                key={ri}
                className="flex items-center gap-3 px-3 py-3 border-b border-slate-100 last:border-b-0"
              >
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 flex-1 max-w-md" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
