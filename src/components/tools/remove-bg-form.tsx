"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useProcessing } from "@/hooks/use-processing";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { ImagePreview } from "@/components/shared/image-preview";
import { ProcessingStatus } from "@/components/shared/processing-status";
import { DownloadButton } from "@/components/shared/download-button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type BackgroundType = "transparent" | "color" | "blur";

export function RemoveBgForm() {
  const { isSignedIn } = useUser();
  const [backgroundType, setBackgroundType] =
    useState<BackgroundType>("transparent");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [blurAmount, setBlurAmount] = useState(20);

  const {
    files,
    previews,
    setFiles,
    removeFile,
    clearFiles,
  } = useImageUpload({ maxFiles: 1 });
  const {
    processImage,
    status,
    result,
    error,
    reset: resetProcessing,
  } = useProcessing();

  if (!isSignedIn) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium">Sign in required</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please sign in to use the background removal tool.
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("files", files[0]);
    formData.append(
      "options",
      JSON.stringify({
        background: backgroundType,
        ...(backgroundType === "color" && { backgroundColor }),
        ...(backgroundType === "blur" && { blurAmount }),
      })
    );

    await processImage("/api/process/remove-bg", formData);
  };

  const handleReset = () => {
    clearFiles();
    resetProcessing();
    setBackgroundType("transparent");
    setBackgroundColor("#ffffff");
    setBlurAmount(20);
  };

  return (
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={setFiles}
        maxFiles={1}
        selectedFiles={files}
        onRemoveFile={removeFile}
      />

      {files.length > 0 && (
        <ImagePreview
          originalSrc={previews[0]}
          processedSrc={
            result ? result.downloadUrl : undefined
          }
        />
      )}

      <div className="space-y-4">
        <div className="space-y-3">
          <Label>Background Type</Label>
          <RadioGroup
            value={backgroundType}
            onValueChange={(val) => setBackgroundType(val as BackgroundType)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="transparent" />
              <Label className="font-normal cursor-pointer">Transparent</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="color" />
              <Label className="font-normal cursor-pointer">Solid Color</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="blur" />
              <Label className="font-normal cursor-pointer">
                Blurred Background
              </Label>
            </div>
          </RadioGroup>
        </div>

        {backgroundType === "color" && (
          <div className="space-y-2">
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-28"
                placeholder="#ffffff"
              />
            </div>
          </div>
        )}

        {backgroundType === "blur" && (
          <div className="space-y-2">
            <Label>Blur Amount: {blurAmount}</Label>
            <Slider
              value={[blurAmount]}
              onValueChange={(v) => setBlurAmount(Array.isArray(v) ? v[0] : v)}
              min={1}
              max={50}
              step={1}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || status === "processing"}
        >
          {status === "processing" ? "Removing Background..." : "Remove Background"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <ProcessingStatus status={status} errorMessage={error ?? undefined} onRetry={handleSubmit} />

      {result && (
        <DownloadButton
          downloadUrl={result.downloadUrl}
          fileName="removed-bg.png"
        />
      )}
    </div>
  );
}
