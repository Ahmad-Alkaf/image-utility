"use client";

import { useState, useCallback } from "react";
import type { ProcessingResult } from "@/types";

type ProcessingState = "idle" | "uploading" | "processing" | "completed" | "failed";

interface UseProcessingReturn {
  status: ProcessingState;
  progress: number;
  result: ProcessingResult | null;
  results: ProcessingResult[];
  error: string | null;
  processImage: (
    endpoint: string,
    formData: FormData
  ) => Promise<ProcessingResult | null>;
  processBatch: (
    endpoint: string,
    buildFormData: (file: File) => FormData,
    files: File[]
  ) => Promise<ProcessingResult[]>;
  reset: () => void;
}

export function useProcessing(): UseProcessingReturn {
  const [status, setStatus] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [results, setResults] = useState<ProcessingResult[]>([]);
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
      setResults([]);

      let progressInterval: ReturnType<typeof setInterval> | undefined;
      try {
        // Simulate upload progress
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev < 40) return prev + 5;
            return prev;
          });
        }, 200);

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        setStatus("processing");
        setProgress(50);

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
        setResults([processingResult]);
        setStatus("completed");
        setProgress(100);
        return processingResult;
      } catch (err) {
        clearInterval(progressInterval);
        const message = err instanceof Error ? err.message : "Processing failed";
        setError(message);
        setStatus("failed");
        return null;
      }
    },
    []
  );

  const processBatch = useCallback(
    async (
      endpoint: string,
      buildFormData: (file: File) => FormData,
      files: File[]
    ): Promise<ProcessingResult[]> => {
      if (files.length === 0) return [];

      // Single file: delegate to processImage
      if (files.length === 1) {
        const r = await processImage(endpoint, buildFormData(files[0]));
        return r ? [r] : [];
      }

      setStatus("uploading");
      setProgress(0);
      setError(null);
      setResult(null);
      setResults([]);

      const collected: ProcessingResult[] = [];
      const total = files.length;
      let failed = 0;

      setStatus("processing");

      for (let i = 0; i < total; i++) {
        setProgress(Math.round(((i) / total) * 100));

        try {
          const formData = buildFormData(files[i]);
          const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`File ${i + 1} failed:`, errorData.error);
            failed++;
            continue;
          }

          const data = await response.json();
          const processingResult: ProcessingResult = {
            jobId: data.jobId,
            downloadUrl: data.downloadUrl,
            outputMeta: data.outputMeta,
          };
          collected.push(processingResult);
          setResults([...collected]);
        } catch (err) {
          console.error(`File ${i + 1} failed:`, err);
          failed++;
        }
      }

      setProgress(100);

      if (collected.length === 0) {
        setError("All files failed to process");
        setStatus("failed");
      } else {
        setResult(collected[0]);
        setResults(collected);
        setStatus("completed");
        if (failed > 0) {
          setError(`${failed} of ${total} files failed`);
        }
      }

      return collected;
    },
    [processImage]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setResults([]);
    setError(null);
  }, []);

  return {
    status,
    progress,
    result,
    results,
    error,
    processImage,
    processBatch,
    reset,
  };
}
