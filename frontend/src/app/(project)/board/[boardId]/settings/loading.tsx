import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mb-8 pb-6 border-b border-slate-200">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="max-w-4xl mx-auto space-y-6 pb-10">
          <Skeleton className="h-6 w-40 mb-2" />

          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2 border-b border-slate-100 pb-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
