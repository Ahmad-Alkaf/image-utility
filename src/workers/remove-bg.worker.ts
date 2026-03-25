import { removeBackground, type Config } from "@imgly/background-removal";

export type WorkerRequest = {
  type: "process";
  file: File;
};

export type WorkerResponse =
  | { type: "progress"; phase: "downloading" | "processing"; progress: number }
  | { type: "done"; blob: Blob }
  | { type: "error"; message: string };

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  if (e.data.type !== "process") return;

  try {
    // Track the highest progress seen to prevent backwards jumps.
    // Fetch phase occupies 0-60%, compute phase occupies 60-100%.
    let maxProgress = 0;

    function send(phase: "downloading" | "processing", raw: number) {
      // Clamp: never go backwards
      if (raw > maxProgress) maxProgress = raw;
      self.postMessage({
        type: "progress",
        phase,
        progress: maxProgress,
      } satisfies WorkerResponse);
    }

    const config: Config = {
      output: { format: "image/png", quality: 1 },
      progress: (key: string, current: number, total: number) => {
        if (key.startsWith("fetch:")) {
          // Fetch: cumulative bytes downloaded — map to 0-60%
          const pct = total > 0 ? (current / total) * 60 : 0;
          send("downloading", Math.round(pct));
        } else if (key.startsWith("compute:")) {
          // Compute: 4 discrete steps — map to 60-100%
          // current is the step index (0-4), total is always 4
          const pct = 60 + (current / total) * 40;
          send("processing", Math.round(pct));
        }
      },
    };

    const blob = await removeBackground(e.data.file, config);
    self.postMessage({ type: "done", blob } satisfies WorkerResponse);
  } catch (err) {
    self.postMessage({
      type: "error",
      message:
        err instanceof Error ? err.message : "Background removal failed",
    } satisfies WorkerResponse);
  }
};
