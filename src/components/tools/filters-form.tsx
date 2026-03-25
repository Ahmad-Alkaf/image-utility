"use client";

import { useState } from "react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useProcessing } from "@/hooks/use-processing";
import { SignInGate } from "@/components/shared/sign-in-gate";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { ImagePreview } from "@/components/shared/image-preview";
import { ProcessingStatus } from "@/components/shared/processing-status";
import { DownloadButton } from "@/components/shared/download-button";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { UPLOAD_LIMITS } from "@/lib/constants";

type Preset = "grayscale" | "sepia" | "invert" | "vintage" | "cool" | "warm";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "grayscale", label: "Grayscale" },
  { value: "sepia", label: "Sepia" },
  { value: "invert", label: "Invert" },
  { value: "vintage", label: "Vintage" },
  { value: "cool", label: "Cool" },
  { value: "warm", label: "Warm" },
];

export function FiltersForm() {
  const [preset, setPreset] = useState<Preset | undefined>(undefined);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [blur, setBlur] = useState(0);
  const [gamma, setGamma] = useState(1);

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

  const handleSubmit = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("files", files[0]);
    formData.append(
      "options",
      JSON.stringify({
        brightness,
        contrast,
        saturation,
        hue,
        sharpness,
        blur,
        gamma,
        ...(preset && { preset }),
      })
    );

    await processImage("/api/process/filters", formData);
  };

  const handleReset = () => {
    clearFiles();
    resetProcessing();
    setPreset(undefined);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setHue(0);
    setSharpness(0);
    setBlur(0);
    setGamma(1);
  };

  // CSS filter string for live preview
  const cssFilter = [
    `brightness(${1 + brightness / 100})`,
    `contrast(${1 + contrast / 100})`,
    `saturate(${1 + saturation / 100})`,
    `hue-rotate(${hue}deg)`,
    blur > 0 ? `blur(${blur / 10}px)` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SignInGate toolName="filters & adjustments">
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={setFiles}
        maxFiles={1}
        maxFileSize={UPLOAD_LIMITS.authenticated.maxFileSize}
        isSignedIn={true}
        selectedFiles={files}
        onRemoveFile={removeFile}
      />

      {files.length > 0 && previews[0] && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="overflow-hidden rounded-lg border bg-[url('/checkerboard.svg')] bg-repeat max-h-96 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previews[0]}
              alt="Preview with filters"
              className="max-w-full max-h-96 object-contain"
              style={{ filter: cssFilter }}
            />
          </div>
        </div>
      )}

      {files.length > 0 && result && (
        <ImagePreview
          originalSrc={previews[0]}
          processedSrc={`${result.downloadUrl}?inline=true`}
        />
      )}

      {/* Preset Filters */}
      <div className="space-y-3">
        <Label>Preset Filters</Label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.value}
              variant={preset === p.value ? "default" : "outline"}
              size="sm"
              className="w-full"
              onClick={() =>
                setPreset(preset === p.value ? undefined : p.value)
              }
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Adjustment Sliders */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Adjustments</Label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Brightness</Label>
            <span className="text-sm text-muted-foreground">{brightness}</span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={(v) => setBrightness(Array.isArray(v) ? v[0] : v)}
            min={-100}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Contrast</Label>
            <span className="text-sm text-muted-foreground">{contrast}</span>
          </div>
          <Slider
            value={[contrast]}
            onValueChange={(v) => setContrast(Array.isArray(v) ? v[0] : v)}
            min={-100}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Saturation</Label>
            <span className="text-sm text-muted-foreground">{saturation}</span>
          </div>
          <Slider
            value={[saturation]}
            onValueChange={(v) => setSaturation(Array.isArray(v) ? v[0] : v)}
            min={-100}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Hue</Label>
            <span className="text-sm text-muted-foreground">{hue}&deg;</span>
          </div>
          <Slider
            value={[hue]}
            onValueChange={(v) => setHue(Array.isArray(v) ? v[0] : v)}
            min={0}
            max={360}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sharpness</Label>
            <span className="text-sm text-muted-foreground">{sharpness}</span>
          </div>
          <Slider
            value={[sharpness]}
            onValueChange={(v) => setSharpness(Array.isArray(v) ? v[0] : v)}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Blur</Label>
            <span className="text-sm text-muted-foreground">{blur}</span>
          </div>
          <Slider
            value={[blur]}
            onValueChange={(v) => setBlur(Array.isArray(v) ? v[0] : v)}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Gamma</Label>
            <span className="text-sm text-muted-foreground">{gamma.toFixed(1)}</span>
          </div>
          <Slider
            value={[gamma]}
            onValueChange={(v) => setGamma(Array.isArray(v) ? v[0] : v)}
            min={0.1}
            max={3}
            step={0.1}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || status === "processing" || status === "uploading"}
        >
          {status === "processing" || status === "uploading" ? "Applying Filters..." : "Apply Filters"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <ProcessingStatus status={status} errorMessage={error ?? undefined} onRetry={handleSubmit} />

      {result && (
        <DownloadButton
          downloadUrl={result.downloadUrl}
          fileName="filtered-image.png"
        />
      )}
    </div>
    </SignInGate>
  );
}
