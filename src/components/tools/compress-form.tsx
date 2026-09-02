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
import { UPLOAD_LIMITS, TOOL_ACCEPTED_TYPES } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";

const FORMAT_OPTIONS = [
  { value: "original", label: "Keep the original format" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "png", label: "PNG" },
];

export function CompressForm() {
  const { isSignedIn } = useUser();
  const limits = isSignedIn ? UPLOAD_LIMITS.authenticated : UPLOAD_LIMITS.anonymous;

  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState("original");

  const { files, previews, setFiles, removeFile, clearFiles } = useImageUpload();
  const { processImage, status, progress, result, error, reset: resetProcessing } =
    useProcessing();

  const isBusy = status === "processing" || status === "uploading";
  const isPngOutput =
    format === "png" || (format === "original" && files[0]?.type === "image/png");

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
    setMode("auto");
    setQuality(75);
    setFormat("original");
  };

  const compressedSize = result?.outputMeta?.fileSize ?? 0;
  const originalSize =
    (result?.outputMeta as Record<string, unknown> | undefined)?.originalSize as number | undefined;
  const savedPercentage =
    originalSize && compressedSize
      ? Math.round((1 - compressedSize / originalSize) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={setFiles}
        maxFiles={1}
        maxFileSize={limits.maxFileSize}
        accept={[...TOOL_ACCEPTED_TYPES.compress]}
        isSignedIn={!!isSignedIn}
        selectedFiles={files}
        onRemoveFile={removeFile}
      />

      {files.length > 0 && (
        <ImagePreview
          originalSrc={previews[0]}
          processedSrc={result ? `${result.downloadUrl}&inline=true` : undefined}
          originalMeta={{ fileName: files[0].name, size: files[0].size }}
          processedMeta={
            result
              ? {
                  fileName: result.outputMeta.fileName,
                  size: result.outputMeta.fileSize,
                  width: result.outputMeta.width,
                  height: result.outputMeta.height,
                }
              : undefined
          }
        />
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Mode</Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "auto" | "manual")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Automatic</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {mode === "auto"
              ? "Picks a quality that shrinks the file a lot with little visible change. If nothing helps, you get the original back."
              : "Set the quality yourself. Lower values give smaller files."}
          </p>
        </div>

        {mode === "manual" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Quality</Label>
              <span className="text-sm text-muted-foreground">{quality}</span>
            </div>
            <Slider
              value={[quality]}
              onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
              min={1}
              max={100}
              step={1}
              aria-label="Quality"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Smaller file</span>
              <span>Higher quality</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="format-select">Output format</Label>
          <Select value={format} onValueChange={(v) => v && setFormat(v)} items={FORMAT_OPTIONS}>
            <SelectTrigger id="format-select">
              <SelectValue placeholder="Choose a format" />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isPngOutput
              ? "PNG output uses a 256-color palette below quality 100. Photos usually get much smaller as WebP or JPEG."
              : "Switching photos to WebP or AVIF usually gives the biggest savings."}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={files.length === 0 || isBusy}>
          {isBusy ? "Compressing..." : "Compress"}
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

      {result && originalSize && compressedSize > 0 && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Result</span>
            {savedPercentage > 0 ? (
              <Badge className="border-green-500/20 bg-green-500/15 text-green-600 hover:bg-green-500/20">
                {savedPercentage}% smaller
              </Badge>
            ) : (
              <Badge variant="secondary">Already as small as it gets</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(originalSize)} to {formatFileSize(compressedSize)}
          </p>
        </div>
      )}

      {result && (
        <DownloadButton downloadUrl={result.downloadUrl} fileName={result.outputMeta.fileName} />
      )}
    </div>
  );
}
