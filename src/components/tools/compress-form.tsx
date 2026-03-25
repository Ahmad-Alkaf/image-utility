"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useProcessing } from "@/hooks/use-processing";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { ImagePreview } from "@/components/shared/image-preview";
import { ProcessingStatus } from "@/components/shared/processing-status";
import { DownloadButton } from "@/components/shared/download-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UPLOAD_LIMITS } from "@/lib/constants";

const FORMAT_OPTIONS = [
  { value: "original", label: "Keep Original" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "png", label: "PNG" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CompressForm() {
  const { isSignedIn } = useUser();
  const limits = isSignedIn ? UPLOAD_LIMITS.authenticated : UPLOAD_LIMITS.anonymous;

  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState("original");

  const { files, previews, setFiles, removeFile, clearFiles } = useImageUpload();
  const {
    processImage,
    status,
    progress,
    result,
    error,
    reset: resetProcessing,
  } = useProcessing();

  const handleSubmit = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("files", files[0]);
    formData.append(
      "options",
      JSON.stringify({
        mode,
        quality: mode === "auto" ? 100 : quality,
        ...(format !== "original" && { format }),
      })
    );

    await processImage("/api/process/compress", formData);
  };

  const handleReset = () => {
    clearFiles();
    resetProcessing();
  };

  const compressedSize = result?.outputMeta?.fileSize ?? 0;
  const originalSizeFromMeta =
    (result?.outputMeta as Record<string, unknown>)?.originalSize as
      | number
      | undefined;
  const savedPercentage =
    originalSizeFromMeta && compressedSize
      ? Math.round((1 - compressedSize / originalSizeFromMeta) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={setFiles}
        maxFiles={1}
        maxFileSize={limits.maxFileSize}
        isSignedIn={!!isSignedIn}
        selectedFiles={files}
        onRemoveFile={removeFile}
      />

      {files.length > 0 && (
        <ImagePreview
          originalSrc={previews[0]}
          originalMeta={{
            fileName: files[0].name,
            size: files[0].size,
          }}
        />
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Compression Mode</Label>
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "auto" | "manual")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Auto</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {mode === "auto"
              ? "Automatically finds the best balance between quality and file size."
              : "Manually set the compression quality level."}
          </p>
        </div>

        {mode === "manual" && (
          <div className="space-y-2">
            <Label>Quality: {quality}</Label>
            <Slider
              value={[quality]}
              onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
              min={1}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Smaller file</span>
              <span>Higher quality</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="format-select">Output Format</Label>
          <Select value={format} onValueChange={(v) => v && setFormat(v)}>
            <SelectTrigger id="format-select">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || status === "processing" || status === "uploading"}
        >
          {status === "processing" || status === "uploading" ? "Compressing..." : "Compress"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <ProcessingStatus
        status={status}
        progress={progress}
        errorMessage={error ?? undefined}
        onRetry={handleSubmit}
      />

      {result && originalSizeFromMeta && compressedSize > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Compression Results</span>
            {savedPercentage > 0 ? (
              <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/20 border-green-500/20">
                Saved {savedPercentage}%
              </Badge>
            ) : (
              <Badge variant="secondary">No reduction</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatFileSize(originalSizeFromMeta)}</span>
            <span>&rarr;</span>
            <span>{formatFileSize(compressedSize)}</span>
          </div>
        </div>
      )}

      {result && (
        <DownloadButton
          downloadUrl={result.downloadUrl}
          fileName={`compressed.${format !== "original" ? format : "image"}`}
        />
      )}
    </div>
  );
}
