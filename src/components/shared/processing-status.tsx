"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface ProcessingStatusProps {
  status: "idle" | "uploading" | "processing" | "completed" | "failed";
  progress?: number;
  errorMessage?: string;
  /** Replaces the default "Processing..." label. */
  message?: string;
  /** Extra note shown under a completed status, e.g. "2 of 5 files failed". */
  note?: string;
  onRetry?: () => void;
}

export function ProcessingStatus({
  status,
  progress = 0,
  errorMessage,
  message,
  note,
  onRetry,
}: ProcessingStatusProps) {
  if (status === "idle") return null;

  return (
    <div className="space-y-3 rounded-lg border p-4" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        {status === "uploading" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Uploading...</span>
          </>
        )}
        {status === "processing" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">{message || "Processing..."}</span>
          </>
        )}
        {status === "completed" && (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-500">
              Done. Your file is ready.
            </span>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Something went wrong
            </span>
          </>
        )}
      </div>

      {(status === "uploading" || status === "processing") && (
        <Progress value={progress} className="h-2" />
      )}

      {status === "completed" && note && (
        <p className="text-sm text-muted-foreground">{note}</p>
      )}

      {status === "failed" && errorMessage && (
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      )}

      {status === "failed" && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
