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
import { Download, ShieldCheck } from "lucide-react";
import { UPLOAD_LIMITS, TOOL_ACCEPTED_TYPES } from "@/lib/constants";

type BackgroundType = "transparent" | "color" | "blur";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function RemoveBgForm() {
  const [backgroundType, setBackgroundType] = useState<BackgroundType>("transparent");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [blurAmount, setBlurAmount] = useState(20);

  const { files, previews, setFiles, removeFile, clearFiles } = useImageUpload({ maxFiles: 1 });
  const { status, progress, progressLabel, result, error, process, reset: resetProcessing } =
    useRemoveBg();

  const isProcessing = status === "loading-model" || status === "processing";
  const displayStatus = isProcessing ? "processing" : status;
  const colorIsValid = HEX_COLOR.test(backgroundColor);

  const handleSubmit = async () => {
    if (files.length === 0) return;
    await process(files[0], {
      background: backgroundType,
      ...(backgroundType === "color" && { backgroundColor: colorIsValid ? backgroundColor : "#ffffff" }),
      ...(backgroundType === "blur" && { blurAmount }),
    });
  };

  const handleDownload = () => {
    if (!result) return;
    const base = files[0]?.name.replace(/\.[^.]+$/, "") || "image";
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${base}-no-background.png`;
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

  return (
    <SignInGate toolName="background remover">
      <div className="space-y-6">
        <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            This tool runs in your browser. The photo is never uploaded. The
            first run downloads the AI model, which can take a minute on a slow
            connection. After that it is cached.
          </p>
        </div>

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
            originalMeta={{ fileName: files[0].name, size: files[0].size }}
            processedMeta={
              result
                ? {
                    fileName: "PNG with transparency",
                    size: result.blob.size,
                    width: result.width,
                    height: result.height,
                  }
                : undefined
            }
          />
        )}

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>New background</Label>
            <RadioGroup
              value={backgroundType}
              onValueChange={(val) => setBackgroundType(val as BackgroundType)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="transparent" id="bg-transparent" />
                <Label htmlFor="bg-transparent" className="cursor-pointer font-normal">
                  Transparent (PNG)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="color" id="bg-color-option" />
                <Label htmlFor="bg-color-option" className="cursor-pointer font-normal">
                  Solid color
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blur" id="bg-blur" />
                <Label htmlFor="bg-blur" className="cursor-pointer font-normal">
                  Blurred original
                </Label>
              </div>
            </RadioGroup>
          </div>

          {backgroundType === "color" && (
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="bg-color"
                  type="color"
                  value={colorIsValid ? backgroundColor : "#ffffff"}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer p-1"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-28"
                  placeholder="#ffffff"
                  aria-label="Background color hex value"
                  aria-invalid={!colorIsValid}
                />
                {!colorIsValid && (
                  <span className="text-xs text-destructive">Use a hex color like #1e90ff</span>
                )}
              </div>
            </div>
          )}

          {backgroundType === "blur" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Blur strength</Label>
                <span className="text-sm text-muted-foreground">{blurAmount}</span>
              </div>
              <Slider
                value={[blurAmount]}
                onValueChange={(v) => setBlurAmount(Array.isArray(v) ? v[0] : v)}
                min={1}
                max={50}
                step={1}
                aria-label="Blur strength"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={files.length === 0 || isProcessing}>
            {isProcessing ? "Working..." : "Remove background"}
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
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
        )}
      </div>
    </SignInGate>
  );
}
