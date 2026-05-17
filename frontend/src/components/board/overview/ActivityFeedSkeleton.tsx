import { Skeleton } from "@/components/ui/Skeleton";

export function ActivityFeedSkeleton() {
  return (
    <ul className="divide-y divide-slate-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 py-3 first:pt-1 last:pb-1">
          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
