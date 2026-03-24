"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const FORMAT_OPTIONS = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "tiff", label: "TIFF" },
  { value: "gif", label: "GIF" },
];

export function ConvertForm() {
  const [targetFormat, setTargetFormat] = useState("webp");
  const [quality, setQuality] = useState(100);
  const [stripMetadata, setStripMetadata] = useState(false);

  const {
    files,
    previews,
    setFiles,
    removeFile,
    clearFiles,
  } = useImageUpload({ maxFiles: 20 });
  const { processImage, status, result, error, reset: resetProcessing } =
    useProcessing();

  const handleSubmit = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("files", files[0]);
    formData.append(
      "options",
      JSON.stringify({
        format: targetFormat,
        quality,
        stripMetadata,
      })
    );

    await processImage("/api/process/convert", formData);
  };

  const handleReset = () => {
    clearFiles();
    resetProcessing();
    setTargetFormat("webp");
    setQuality(100);
    setStripMetadata(false);
  };

  return (
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={setFiles}
        maxFiles={20}
        selectedFiles={files}
        onRemoveFile={removeFile}
      />

      {files.length > 0 && previews[0] && (
        <ImagePreview
          originalSrc={previews[0]}
          processedSrc={result ? result.downloadUrl : undefined}
          originalMeta={{
            fileName: files[0].name,
            size: files[0].size,
          }}
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
          <Label htmlFor="format-select">Target Format</Label>
          <Select value={targetFormat} onValueChange={(v) => v && setTargetFormat(v)}>
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

        <div className="space-y-2">
          <Label>Quality: {quality}</Label>
          <Slider
            value={[quality]}
            onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
            min={1}
            max={100}
            step={1}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="strip-metadata"
            checked={stripMetadata}
            onCheckedChange={setStripMetadata}
          />
          <Label htmlFor="strip-metadata">Strip Metadata</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || status === "processing"}
        >
          {status === "processing" ? "Converting..." : "Convert"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <ProcessingStatus
        status={status}
        errorMessage={error ?? undefined}
        onRetry={handleSubmit}
      />

      {result && (
        <DownloadButton
          downloadUrl={result.downloadUrl}
          fileName={`converted.${targetFormat}`}
        />
      )}
    </div>
  );
}
