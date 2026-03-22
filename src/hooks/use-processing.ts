"use client";

import { useState, useCallback } from "react";
import type { ProcessingResult } from "@/types";

type ProcessingState = "idle" | "uploading" | "processing" | "completed" | "failed";

interface UseProcessingReturn {
  status: ProcessingState;
  progress: number;
  result: ProcessingResult | null;
  error: string | null;
  processImage: (
    endpoint: string,
    formData: FormData
  ) => Promise<ProcessingResult | null>;
  reset: () => void;
}

export function useProcessing(): UseProcessingReturn {
  const [status, setStatus] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(
    async (
      endpoint: string,
      formData: FormData
    ): Promise<ProcessingResult | null> => {
      setStatus("uploading");
      setProgress(10);
      setError(null);
      setResult(null);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev < 40) return prev + 5;
            return prev;
          });
        }, 200);

        setStatus("processing");
        setProgress(50);

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Processing failed (${response.status})`);
        }

        setProgress(90);
        const data = await response.json();

        const processingResult: ProcessingResult = {
          jobId: data.jobId,
          downloadUrl: data.downloadUrl,
          outputMeta: data.outputMeta,
        };

        setResult(processingResult);
        setStatus("completed");
        setProgress(100);
        return processingResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Processing failed";
        setError(message);
        setStatus("failed");
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    progress,
    result,
    error,
    processImage,
    reset,
  };
}
