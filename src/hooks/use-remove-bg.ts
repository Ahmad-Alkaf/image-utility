"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { WorkerRequest, WorkerResponse } from "@/workers/remove-bg.worker";

type Status = "idle" | "loading-model" | "processing" | "completed" | "failed";

interface RemoveBgResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

interface UseRemoveBgReturn {
  status: Status;
  progress: number;
  progressLabel: string;
  result: RemoveBgResult | null;
  error: string | null;
  process: (
    file: File,
    options: {
      background: "transparent" | "color" | "blur";
      backgroundColor?: string;
      blurAmount?: number;
    }
  ) => Promise<void>;
  reset: () => void;
}

export function useRemoveBg(): UseRemoveBgReturn {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<RemoveBgResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const cleanup = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  }, []);

  const process = useCallback(
    async (
      file: File,
      options: {
        background: "transparent" | "color" | "blur";
        backgroundColor?: string;
        blurAmount?: number;
      }
    ) => {
      cleanup();
      setError(null);
      setResult(null);
      setStatus("loading-model");
      setProgress(0);
      setProgressLabel("Loading AI model...");

      // Terminate any previous worker
      workerRef.current?.terminate();

      const worker = new Worker(
        new URL("@/workers/remove-bg.worker.ts", import.meta.url)
      );
      workerRef.current = worker;

      return new Promise<void>((resolve) => {
        worker.onmessage = async (e: MessageEvent<WorkerResponse>) => {
          const msg = e.data;

          if (msg.type === "progress") {
            // Worker sends a single 0-100 progress that never goes backwards:
            //   0-60%  = downloading model
            //   60-100% = processing image
            setProgress(msg.progress);
            if (msg.phase === "downloading") {
              setStatus("loading-model");
              setProgressLabel("Downloading AI model...");
            } else {
              setStatus("processing");
              setProgressLabel("Removing background...");
            }
          } else if (msg.type === "done") {
            try {
              setProgressLabel("Applying background...");

              const outputBlob = await applyBackground(
                file,
                msg.blob,
                options
              );

              const url = URL.createObjectURL(outputBlob);
              resultUrlRef.current = url;
              const { width, height } = await getImageDimensions(url);

              setResult({ blob: outputBlob, url, width, height });
              setStatus("completed");
              setProgress(100);
              setProgressLabel("");
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Post-processing failed"
              );
              setStatus("failed");
            }
            worker.terminate();
            resolve();
          } else if (msg.type === "error") {
            setError(msg.message);
            setStatus("failed");
            worker.terminate();
            resolve();
          }
        };

        worker.onerror = (err) => {
          setError(err.message || "Worker error");
          setStatus("failed");
          worker.terminate();
          resolve();
        };

        worker.postMessage({ type: "process", file } satisfies WorkerRequest);
      });
    },
    [cleanup]
  );

  const reset = useCallback(() => {
    cleanup();
    workerRef.current?.terminate();
    setStatus("idle");
    setProgress(0);
    setProgressLabel("");
    setResult(null);
    setError(null);
  }, [cleanup]);

  return { status, progress, progressLabel, result, error, process, reset };
}

function getImageDimensions(
  src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to read image dimensions"));
    img.src = src;
  });
}

async function applyBackground(
  originalFile: File,
  fgBlob: Blob,
  options: {
    background: "transparent" | "color" | "blur";
    backgroundColor?: string;
    blurAmount?: number;
  }
): Promise<Blob> {
  if (options.background === "transparent") {
    return fgBlob;
  }

  const fgBitmap = await createImageBitmap(fgBlob);
  const { width, height } = fgBitmap;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;

  if (options.background === "color") {
    ctx.fillStyle = options.backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(fgBitmap, 0, 0);
  } else if (options.background === "blur") {
    const originalBitmap = await createImageBitmap(originalFile);
    ctx.filter = `blur(${options.blurAmount || 20}px)`;
    const extend = (options.blurAmount || 20) * 2;
    ctx.drawImage(
      originalBitmap,
      -extend,
      -extend,
      width + extend * 2,
      height + extend * 2
    );
    ctx.filter = "none";
    ctx.drawImage(fgBitmap, 0, 0);
    originalBitmap.close();
  }

  fgBitmap.close();
  return canvas.convertToBlob({ type: "image/png" });
}
