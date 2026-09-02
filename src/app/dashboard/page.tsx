import { Metadata } from "next";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { FILE_RETENTION_HOURS } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";

export const metadata: Metadata = {
  title: "History",
  robots: { index: false, follow: false },
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
    take: 100,
    select: {
      id: true,
      type: true,
      status: true,
      inputFileName: true,
      inputFileSize: true,
      outputFileName: true,
      outputFileSize: true,
      createdAt: true,
      completedAt: true,
      processingTimeMs: true,
      downloadToken: true,
      filesDeletedAt: true,
    },
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
    <div className="space-y-8 p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your last {jobs.length === 100 ? "100 " : ""}jobs. Results can be
          downloaded for {FILE_RETENTION_HOURS} hours, then the files are deleted.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Jobs</p>
          <p className="mt-1 text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-500">
            {stats.completed}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Space saved</p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {formatFileSize(stats.totalSaved)}
          </p>
        </div>
      </div>

      <DashboardContent initialJobs={JSON.parse(JSON.stringify(jobs))} />
    </div>
  );
}
