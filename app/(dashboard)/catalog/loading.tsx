import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div>
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4 mb-3" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
