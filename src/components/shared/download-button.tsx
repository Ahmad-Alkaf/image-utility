"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Archive, Loader2 } from "lucide-react";

const EXPIRED_MESSAGE = "This file has expired. Results are kept for 24 hours.";

async function readError(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => null);
  return (data && typeof data.error === "string" && data.error) || fallback;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface DownloadButtonProps {
  downloadUrl: string;
  fileName: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  label?: string;
}

export function DownloadButton({
  downloadUrl,
  fileName,
  variant = "default",
  size = "default",
  label = "Download",
}: DownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        setError(await readError(response, response.status === 410 ? EXPIRED_MESSAGE : "Download failed. Please try again."));
        return;
      }
      saveBlob(await response.blob(), fileName);
    } catch {
      setError("Download failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1.5">
      <Button variant={variant} size={size} onClick={handleDownload} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface DownloadAllButtonProps {
  files: { url: string; name: string }[];
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  zipName?: string;
}

export function DownloadAllButton({
  files,
  variant = "default",
  size = "default",
  zipName = "imageforge-batch.zip",
}: DownloadAllButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadAll = async () => {
    setBusy(true);
    setError(null);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const fetched = await Promise.all(
        files.map(async (file) => {
          const response = await fetch(file.url);
          if (!response.ok) return null;
          return { name: file.name, blob: await response.blob() };
        })
      );

      const nameCounts = new Map<string, number>();
      let added = 0;
      for (const entry of fetched) {
        if (!entry) continue;
        let zipEntryName = entry.name;
        const count = nameCounts.get(entry.name) || 0;
        if (count > 0) {
          const dotIdx = entry.name.lastIndexOf(".");
          const base = dotIdx > 0 ? entry.name.slice(0, dotIdx) : entry.name;
          const ext = dotIdx > 0 ? entry.name.slice(dotIdx) : "";
          zipEntryName = `${base} (${count})${ext}`;
        }
        nameCounts.set(entry.name, count + 1);
        zip.file(zipEntryName, entry.blob);
        added++;
      }

      if (added === 0) {
        setError(EXPIRED_MESSAGE);
        return;
      }
      if (added < files.length) {
        setError(`${files.length - added} of ${files.length} files could not be added. They may have expired.`);
      }

      saveBlob(await zip.generateAsync({ type: "blob" }), zipName);
    } catch {
      setError("Could not build the ZIP file. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1.5">
      <Button variant={variant} size={size} onClick={handleDownloadAll} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
        Download all as ZIP ({files.length})
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
