"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/shared/download-button";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { JOB_TYPE_ICONS } from "@/components/shared/tool-icons";
import { FILE_RETENTION_MS } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";

interface Job {
  id: string;
  type: string;
  status: string;
  inputFileName: string;
  inputFileSize: number;
  outputFileName: string | null;
  outputFileSize: number | null;
  createdAt: string;
  completedAt: string | null;
  processingTimeMs: number | null;
  downloadToken: string | null;
  filesDeletedAt: string | null;
}

interface DashboardContentProps {
  initialJobs: Job[];
}

const TOOL_LABELS: Record<string, string> = {
  CONVERT: "Convert",
  REMOVE_BG: "Remove background",
  RESIZE: "Resize",
  COMPRESS: "Compress",
  WATERMARK: "Watermark",
  FILTERS: "Filters",
  METADATA_STRIP: "Remove metadata",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Completed",
  PROCESSING: "Processing",
  PENDING: "Pending",
  FAILED: "Failed",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "default",
  PROCESSING: "secondary",
  PENDING: "outline",
  FAILED: "destructive",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 10;

export function DashboardContent({ initialJobs }: DashboardContentProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  // Snapshot of "now" taken once per mount, so rendering stays pure.
  const [now] = useState(() => Date.now());

  const filtered = useMemo(() => {
    return initialJobs.filter((job) => {
      if (typeFilter !== "all" && job.type !== typeFilter) return false;
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      return true;
    });
  }, [initialJobs, typeFilter, statusFilter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const hasAnyJobs = initialJobs.length > 0;

  return (
    <div className="space-y-4">
      {hasAnyJobs && (
        <div className="flex flex-wrap gap-3">
          <Select
            value={typeFilter}
            onValueChange={(v) => { setTypeFilter(v ?? "all"); setPage(0); }}
            items={{ all: "All tools", ...TOOL_LABELS }}
          >
            <SelectTrigger className="w-44" aria-label="Filter by tool">
              <SelectValue placeholder="All tools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tools</SelectItem>
              {Object.entries(TOOL_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(0); }}
            items={{ all: "All statuses", ...STATUS_LABELS }}
          >
            <SelectTrigger className="w-40" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Tool</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Size</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {hasAnyJobs ? (
                    "No jobs match these filters."
                  ) : (
                    <span>
                      No jobs yet.{" "}
                      <Link href="/convert" className="underline underline-offset-2 hover:text-foreground">
                        Run a tool
                      </Link>{" "}
                      and the result shows up here.
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((job) => {
                const Icon = JOB_TYPE_ICONS[job.type] || Info;
                const isExpired =
                  job.filesDeletedAt !== null ||
                  now - new Date(job.createdAt).getTime() > FILE_RETENTION_MS;

                return (
                  <TableRow key={job.id}>
                    <TableCell className="max-w-50 truncate font-medium" title={job.inputFileName}>
                      {job.inputFileName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="hidden sm:inline">
                          {TOOL_LABELS[job.type] || job.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[job.status] || "outline"}>
                        {STATUS_LABELS[job.status] || job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatFileSize(job.inputFileSize)}
                      {job.outputFileSize ? (
                        <span className="text-xs"> to {formatFileSize(job.outputFileSize)}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(job.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {job.status === "COMPLETED" && !isExpired ? (
                        <DownloadButton
                          downloadUrl={`/api/download/${job.id}${job.downloadToken ? `?token=${job.downloadToken}` : ""}`}
                          fileName={job.outputFileName || "processed"}
                          variant="outline"
                          size="sm"
                        />
                      ) : job.status === "COMPLETED" ? (
                        <span className="text-xs text-muted-foreground">Expired</span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1} to{" "}
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
