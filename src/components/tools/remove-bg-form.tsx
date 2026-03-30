"use client";

import { useState } from "react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useRemoveBg } from "@/hooks/use-remove-bg";
import { SignInGate } from "@/components/shared/sign-in-gate";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { ImagePreview } from "@/components/shared/image-preview";
import { ProcessingStatus } from "@/components/shared/processing-status";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { UPLOAD_LIMITS, TOOL_ACCEPTED_TYPES } from "@/lib/constants";

type BackgroundType = "transparent" | "color" | "blur";

export function RemoveBgForm() {
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
    status,
    progress,
    progressLabel,
    result,
    error,
    process,
    reset: resetProcessing,
  } = useRemoveBg();

  const handleSubmit = async () => {
    if (files.length === 0) return;

    await process(files[0], {
      background: backgroundType,
      ...(backgroundType === "color" && { backgroundColor }),
      ...(backgroundType === "blur" && { blurAmount }),
    });
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = "removed-bg.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    clearFiles();
    resetProcessing();
    setBackgroundType("transparent");
    setBackgroundColor("#ffffff");
    setBlurAmount(20);
  };

  const isProcessing = status === "loading-model" || status === "processing";

  // Map status to ProcessingStatus component's expected values
  const displayStatus =
    status === "loading-model" || status === "processing"
      ? "processing"
      : status;

  return (
    <SignInGate toolName="background removal">
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={setFiles}
        maxFiles={1}
        maxFileSize={UPLOAD_LIMITS.authenticated.maxFileSize}
        accept={[...TOOL_ACCEPTED_TYPES["remove-bg"]]}
        isSignedIn={true}
        selectedFiles={files}
        onRemoveFile={removeFile}
      />

      {files.length > 0 && (
        <ImagePreview
          originalSrc={previews[0]}
          processedSrc={result?.url}
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
          disabled={files.length === 0 || isProcessing}
        >
          {isProcessing ? "Removing Background..." : "Remove Background"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <ProcessingStatus
        status={displayStatus}
        progress={progress}
        errorMessage={error ?? undefined}
        onRetry={handleSubmit}
        message={progressLabel || undefined}
      />

      {result && (
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      )}
    </div>
    </SignInGate>
  );
}
