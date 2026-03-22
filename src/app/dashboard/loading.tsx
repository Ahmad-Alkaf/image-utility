import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <div className="h-9 w-48 bg-muted animate-pulse rounded" />
        <div className="h-5 w-72 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
