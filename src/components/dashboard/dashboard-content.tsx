"use client";

import { useState, useMemo } from "react";
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
import {
  ArrowRightLeft,
  Eraser,
  Maximize2,
  FileDown,
  Stamp,
  SlidersHorizontal,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
}

interface DashboardContentProps {
  initialJobs: Job[];
}

const TOOL_ICONS: Record<string, typeof ArrowRightLeft> = {
  CONVERT: ArrowRightLeft,
  REMOVE_BG: Eraser,
  RESIZE: Maximize2,
  COMPRESS: FileDown,
  WATERMARK: Stamp,
  FILTERS: SlidersHorizontal,
  METADATA_STRIP: Info,
};

const TOOL_LABELS: Record<string, string> = {
  CONVERT: "Convert",
  REMOVE_BG: "Remove BG",
  RESIZE: "Resize",
  COMPRESS: "Compress",
  WATERMARK: "Watermark",
  FILTERS: "Filters",
  METADATA_STRIP: "Metadata",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "default",
  PROCESSING: "secondary",
  PENDING: "outline",
  FAILED: "destructive",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
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

  const filtered = useMemo(() => {
    return initialJobs.filter((job) => {
      if (typeFilter !== "all" && job.type !== typeFilter) return false;
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      return true;
    });
  }, [initialJobs, typeFilter, statusFilter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "all"); setPage(0); }}>
          <SelectTrigger className="w-40">
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

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Tool</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Size</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No processing jobs found.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((job) => {
                const Icon = TOOL_ICONS[job.type] || Info;
                const isExpired =
                  new Date().getTime() -
                    new Date(job.createdAt).getTime() >
                  24 * 60 * 60 * 1000;

                return (
                  <TableRow key={job.id}>
                    <TableCell className="max-w-50 truncate font-medium">
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
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatFileSize(job.inputFileSize)}
                      {job.outputFileSize && (
                        <span className="text-xs">
                          {" "}
                          → {formatFileSize(job.outputFileSize)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
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
                      ) : isExpired ? (
                        <span className="text-xs text-muted-foreground">
                          Expired
                        </span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
