"use client";

import { Button } from "@/components/ui/button";
import { Download, Archive } from "lucide-react";

interface DownloadButtonProps {
  downloadUrl: string;
  fileName: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

export function DownloadButton({
  downloadUrl,
  fileName,
  variant = "default",
  size = "default",
}: DownloadButtonProps) {
  const handleDownload = async () => {
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant={variant} size={size} onClick={handleDownload}>
      <Download className="h-4 w-4 mr-2" />
      Download
    </Button>
  );
}

interface DownloadAllButtonProps {
  files: { url: string; name: string }[];
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

export function DownloadAllButton({
  files,
  variant = "default",
  size = "default",
}: DownloadAllButtonProps) {
  const handleDownloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    await Promise.all(
      files.map(async (file) => {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(file.name, blob);
      })
    );

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "imageforge-batch.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant={variant} size={size} onClick={handleDownloadAll}>
      <Archive className="h-4 w-4 mr-2" />
      Download All as ZIP
    </Button>
  );
}
