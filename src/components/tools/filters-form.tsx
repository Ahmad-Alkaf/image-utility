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
import { UPLOAD_LIMITS, TOOL_ACCEPTED_TYPES, FILTER_PRESETS } from "@/lib/constants";

type Preset = keyof typeof FILTER_PRESETS;

const PRESET_HINTS: Record<Preset, string> = {
  grayscale: "Black and white.",
  sepia: "Warm brown tone, like an old photograph.",
  invert: "Negative: every color is flipped.",
  vintage: "Faded colors with a soft brown tint.",
  cool: "Blue tint.",
  warm: "Orange tint.",
};

interface SliderDef {
  key: "brightness" | "contrast" | "saturation" | "hue" | "sharpness" | "blur" | "gamma";
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
}

const SLIDERS: SliderDef[] = [
  { key: "brightness", label: "Brightness", min: -100, max: 100, step: 1 },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
  { key: "hue", label: "Hue shift", min: 0, max: 360, step: 1, unit: "°" },
  { key: "sharpness", label: "Sharpen", min: 0, max: 100, step: 1 },
  { key: "blur", label: "Blur", min: 0, max: 100, step: 1 },
  { key: "gamma", label: "Gamma", min: 0.1, max: 3, step: 0.1, format: (v) => v.toFixed(1) },
];

const DEFAULTS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  sharpness: 0,
  blur: 0,
  gamma: 1,
};

export function FiltersForm() {
  const [preset, setPreset] = useState<Preset | undefined>(undefined);
  const [values, setValues] = useState({ ...DEFAULTS });

  const { files, previews, setFiles, removeFile, clearFiles } = useImageUpload({ maxFiles: 1 });
  const { processImage, status, progress, result, error, reset: resetProcessing } =
    useProcessing();

  const isBusy = status === "processing" || status === "uploading";
  const hasChanges =
    preset !== undefined ||
    (Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]).some((k) => values[k] !== DEFAULTS[k]);

  const setValue = (key: SliderDef["key"], v: number) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("files", files[0]);
    formData.append("options", JSON.stringify({ ...values, ...(preset && { preset }) }));

    await processImage("/api/process/filters", formData);
  };

  const handleReset = () => {
    clearFiles();
    resetProcessing();
    setPreset(undefined);
    setValues({ ...DEFAULTS });
  };

  const resetAdjustments = () => {
    setPreset(undefined);
    setValues({ ...DEFAULTS });
  };

  // Approximate live preview with CSS filters. Sharpen and gamma have no
  // CSS equivalent, so the final result can differ slightly.
  const cssFilter = [
    `brightness(${1 + values.brightness / 100})`,
    `contrast(${1 + values.contrast / 100})`,
    `saturate(${1 + values.saturation / 100})`,
    `hue-rotate(${values.hue}deg)`,
    values.blur > 0 ? `blur(${values.blur / 10}px)` : "",
    preset === "grayscale" ? "grayscale(1)" : "",
    preset === "sepia" ? "sepia(1)" : "",
    preset === "invert" ? "invert(1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SignInGate toolName="filters and adjustments">
      <div className="space-y-6">
        <ImageDropzone
          onFilesSelected={setFiles}
          maxFiles={1}
          maxFileSize={UPLOAD_LIMITS.authenticated.maxFileSize}
          accept={[...TOOL_ACCEPTED_TYPES.filters]}
          isSignedIn={true}
          selectedFiles={files}
          onRemoveFile={removeFile}
        />

        {files.length > 0 && previews[0] && !result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Live preview</Label>
              <span className="text-xs text-muted-foreground">Approximate. The download is rendered on the server.</span>
            </div>
            <div className="flex max-h-96 items-center justify-center overflow-hidden rounded-lg border bg-[url('/checkerboard.svg')] bg-repeat">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previews[0]}
                alt="Preview with the current adjustments"
                className="max-h-96 max-w-full object-contain"
                style={{ filter: cssFilter }}
              />
            </div>
          </div>
        )}

        {files.length > 0 && result && (
          <ImagePreview
            originalSrc={previews[0]}
            processedSrc={`${result.downloadUrl}&inline=true`}
            originalMeta={{ fileName: files[0].name, size: files[0].size }}
            processedMeta={{
              fileName: result.outputMeta.fileName,
              size: result.outputMeta.fileSize,
              width: result.outputMeta.width,
              height: result.outputMeta.height,
            }}
          />
        )}

        {/* Presets */}
        <div className="space-y-3">
          <Label>Presets</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Presets">
            {(Object.keys(FILTER_PRESETS) as Preset[]).map((p) => (
              <Button
                key={p}
                variant={preset === p ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setPreset(preset === p ? undefined : p)}
                aria-pressed={preset === p}
                title={PRESET_HINTS[p]}
              >
                {FILTER_PRESETS[p].label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {preset ? PRESET_HINTS[preset] : "Optional. Click a preset again to turn it off."}
          </p>
        </div>

        {/* Adjustment sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Adjustments</Label>
            {hasChanges && (
              <Button variant="ghost" size="sm" onClick={resetAdjustments}>
                Reset adjustments
              </Button>
            )}
          </div>

          {SLIDERS.map((s) => (
            <div key={s.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{s.label}</Label>
                <span className="text-sm text-muted-foreground">
                  {s.format ? s.format(values[s.key]) : values[s.key]}
                  {s.unit ?? ""}
                </span>
              </div>
              <Slider
                value={[values[s.key]]}
                onValueChange={(v) => setValue(s.key, Array.isArray(v) ? v[0] : v)}
                min={s.min}
                max={s.max}
                step={s.step}
                aria-label={s.label}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={files.length === 0 || isBusy}>
            {isBusy ? "Applying..." : "Apply"}
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

        {result && (
          <DownloadButton downloadUrl={result.downloadUrl} fileName={result.outputMeta.fileName} />
        )}
      </div>
    </SignInGate>
  );
}
