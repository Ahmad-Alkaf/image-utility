import { Metadata } from "next";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  let user;
  try {
    user = await getOrCreateUser();
  } catch {
    redirect("/sign-in");
  }

  const jobs = await db.processingJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === "COMPLETED").length,
    totalSaved: jobs.reduce((acc, j) => {
      if (j.outputFileSize && j.inputFileSize) {
        return acc + Math.max(0, j.inputFileSize - j.outputFileSize);
      }
      return acc;
    }, 0),
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your processing history and download results.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Jobs</p>
          <p className="text-3xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-3xl font-bold mt-1 text-green-500">
            {stats.completed}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Space Saved</p>
          <p className="text-3xl font-bold mt-1 text-primary">
            {stats.totalSaved > 0
              ? `${(stats.totalSaved / (1024 * 1024)).toFixed(1)} MB`
              : "0 MB"}
          </p>
        </div>
      </div>

      <DashboardContent initialJobs={JSON.parse(JSON.stringify(jobs))} />
    </div>
  );
}
