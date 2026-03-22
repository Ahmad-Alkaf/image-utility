"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingStatusProps {
  status: "idle" | "uploading" | "processing" | "completed" | "failed";
  progress?: number;
  errorMessage?: string;
  onRetry?: () => void;
}

export function ProcessingStatus({
  status,
  progress = 0,
  errorMessage,
  onRetry,
}: ProcessingStatusProps) {
  if (status === "idle") return null;

  return (
    <div className="rounded-lg border p-4 space-y-3">
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
            <span className="text-sm font-medium">Processing your image...</span>
          </>
        )}
        {status === "completed" && (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-500">
              Processing complete!
            </span>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Processing failed
            </span>
          </>
        )}
      </div>

      {(status === "uploading" || status === "processing") && (
        <Progress value={progress} className="h-2" />
      )}

      {status === "failed" && errorMessage && (
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      )}

      {status === "failed" && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}
