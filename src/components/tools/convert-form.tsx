"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useProcessing } from "@/hooks/use-processing";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { ImagePreview } from "@/components/shared/image-preview";
import { ProcessingStatus } from "@/components/shared/processing-status";
import { DownloadButton, DownloadAllButton } from "@/components/shared/download-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  UPLOAD_LIMITS,
  TOOL_ACCEPTED_TYPES,
  SUPPORTED_FORMATS,
  FORMAT_LABELS,
} from "@/lib/constants";

const LOSSLESS_FORMATS = new Set(["png", "tiff"]);

const FORMAT_HINTS: Record<string, string> = {
  png: "Lossless. Keeps transparency. Best for graphics, screenshots, and logos.",
  jpeg: "Small files for photos. No transparency.",
  webp: "Modern web format. Smaller than JPEG and PNG, keeps transparency.",
  avif: "Smallest files, slower to encode. Supported by all current browsers.",
  tiff: "Lossless. Common in print and archiving.",
  gif: "256 colors. Use only when you need GIF specifically.",
};

export function ConvertForm() {
  const { isSignedIn } = useUser();
  const limits = isSignedIn ? UPLOAD_LIMITS.authenticated : UPLOAD_LIMITS.anonymous;

  const [targetFormat, setTargetFormat] = useState("webp");
  const [quality, setQuality] = useState(90);
  const [stripMetadata, setStripMetadata] = useState(false);

  const { files, previews, setFiles, addFiles, removeFile, clearFiles } =
    useImageUpload({ maxFiles: limits.maxFiles });
  const { processBatch, status, progress, result, results, error, reset: resetProcessing } =
    useProcessing();

  const isBusy = status === "processing" || status === "uploading";
  const isLossless = LOSSLESS_FORMATS.has(targetFormat);

  const handleSubmit = async () => {
    if (files.length === 0) return;

    await processBatch(
      "/api/process/convert",
      (file) => {
        const formData = new FormData();
        formData.append("files", file);
        formData.append(
          "options",
          JSON.stringify({ format: targetFormat, quality, stripMetadata })
        );
        return formData;
      },
      files
    );
  };

  const handleReset = () => {
    clearFiles();
    resetProcessing();
    setTargetFormat("webp");
    setQuality(90);
    setStripMetadata(false);
  };

  return (
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={setFiles}
        onFilesAdded={addFiles}
        maxFiles={limits.maxFiles}
        maxFileSize={limits.maxFileSize}
        accept={[...TOOL_ACCEPTED_TYPES.convert]}
        isSignedIn={!!isSignedIn}
        selectedFiles={files}
        onRemoveFile={removeFile}
      />

      {files.length > 0 && previews[0] && (
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
          <Label htmlFor="format-select">Convert to</Label>
          <Select
            value={targetFormat}
            onValueChange={(v) => v && setTargetFormat(v)}
            items={SUPPORTED_FORMATS.map((fmt) => ({ value: fmt, label: FORMAT_LABELS[fmt] }))}
          >
            <SelectTrigger id="format-select">
              <SelectValue placeholder="Choose a format" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_FORMATS.map((fmt) => (
                <SelectItem key={fmt} value={fmt}>
                  {FORMAT_LABELS[fmt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{FORMAT_HINTS[targetFormat]}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{isLossless ? "Compression effort" : "Quality"}</Label>
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
          <p className="text-xs text-muted-foreground">
            {isLossless
              ? "The image stays pixel-perfect at every setting. Lower values only make the file a little bigger."
              : "Lower values give smaller files. 80 to 90 is a good balance for photos."}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="strip-metadata"
            checked={stripMetadata}
            onCheckedChange={setStripMetadata}
          />
          <Label htmlFor="strip-metadata">Remove metadata (EXIF, GPS location, camera info)</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={files.length === 0 || isBusy}>
          {isBusy
            ? `Converting${files.length > 1 ? ` ${results.length + 1} of ${files.length}` : ""}...`
            : files.length > 1
              ? `Convert ${files.length} images`
              : "Convert"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <ProcessingStatus
        status={status}
        progress={progress}
        errorMessage={error ?? undefined}
        note={status === "completed" && error ? error : undefined}
        onRetry={handleSubmit}
      />

      {results.length > 1 && (
        <DownloadAllButton
          files={results.map((r) => ({ url: r.downloadUrl, name: r.outputMeta.fileName }))}
          zipName="imageforge-converted.zip"
        />
      )}

      {results.length === 1 && result && (
        <DownloadButton downloadUrl={result.downloadUrl} fileName={result.outputMeta.fileName} />
      )}
    </div>
  );
}
