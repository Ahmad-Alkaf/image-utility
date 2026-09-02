"use client";

import { useState, useRef } from "react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useProcessing } from "@/hooks/use-processing";
import { SignInGate } from "@/components/shared/sign-in-gate";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { ImagePreview } from "@/components/shared/image-preview";
import { ProcessingStatus } from "@/components/shared/processing-status";
import { DownloadButton } from "@/components/shared/download-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { TOOL_ACCEPTED_TYPES, UPLOAD_LIMITS } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";

const POSITIONS = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top" },
  { value: "top-right", label: "Top right" },
  { value: "center-left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "center-right", label: "Right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom" },
  { value: "bottom-right", label: "Bottom right" },
];

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const MAX_WATERMARK_IMAGE_BYTES = 10 * 1024 * 1024;

export function WatermarkForm() {
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState("bottom-right");
  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const [watermarkImageError, setWatermarkImageError] = useState<string | null>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const { files, previews, setFiles, removeFile, clearFiles } = useImageUpload();
  const { processImage, status, progress, result, error, reset: resetProcessing } =
    useProcessing();

  const isBusy = status === "processing" || status === "uploading";
  const colorIsValid = HEX_COLOR.test(fontColor);
  const canSubmit =
    files.length > 0 &&
    !isBusy &&
    (watermarkType === "text" ? !!text.trim() && colorIsValid : !!watermarkImageFile);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const formData = new FormData();
    formData.append("files", files[0]);
    if (watermarkType === "image" && watermarkImageFile) {
      formData.append("watermarkImage", watermarkImageFile);
    }
    formData.append(
      "options",
      JSON.stringify({
        type: watermarkType,
        text: watermarkType === "text" ? text : undefined,
        fontSize: watermarkType === "text" ? fontSize : undefined,
        fontColor: watermarkType === "text" ? fontColor : undefined,
        opacity,
        rotation,
        position,
      })
    );

    await processImage("/api/process/watermark", formData);
  };

  const handleReset = () => {
    clearFiles();
    resetProcessing();
    setWatermarkImageFile(null);
    setWatermarkImageError(null);
    setText("");
    setFontSize(48);
    setFontColor("#ffffff");
    setOpacity(0.5);
    setRotation(0);
    setPosition("bottom-right");
  };

  const handleWatermarkImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!TOOL_ACCEPTED_TYPES.watermark.includes(file.type)) {
      setWatermarkImageError("Use a PNG, JPEG, WebP, AVIF, TIFF, or GIF file.");
      return;
    }
    if (file.size > MAX_WATERMARK_IMAGE_BYTES) {
      setWatermarkImageError("The watermark image must be 10 MB or smaller.");
      return;
    }
    setWatermarkImageError(null);
    setWatermarkImageFile(file);
  };

  return (
    <SignInGate toolName="watermark">
      <div className="space-y-6">
        <ImageDropzone
          onFilesSelected={(selected) => setFiles(selected)}
          maxFiles={1}
          maxFileSize={UPLOAD_LIMITS.authenticated.maxFileSize}
          accept={[...TOOL_ACCEPTED_TYPES.watermark]}
          isSignedIn={true}
          selectedFiles={files}
          onRemoveFile={removeFile}
        />

        {files.length > 0 && previews.length > 0 && (
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
          <Tabs value={watermarkType} onValueChange={(v) => setWatermarkType(v as "text" | "image")}>
            <TabsList>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="image">Logo or image</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="watermark-text">Text</Label>
                <Input
                  id="watermark-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="For example: © 2026 Your Name"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Font size</Label>
                  <span className="text-sm text-muted-foreground">{fontSize} px</span>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
                  min={8}
                  max={200}
                  step={1}
                  aria-label="Font size"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-color">Text color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="font-color"
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(fontColor) ? fontColor : "#ffffff"}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border bg-transparent p-1"
                  />
                  <Input
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="w-32"
                    placeholder="#ffffff"
                    aria-label="Text color hex value"
                    aria-invalid={!colorIsValid}
                  />
                  {!colorIsValid && (
                    <span className="text-xs text-destructive">Use a hex color like #ffffff</span>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Watermark image</Label>
                {watermarkImageFile ? (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{watermarkImageFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(watermarkImageFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setWatermarkImageFile(null)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => watermarkInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose a logo or image
                  </Button>
                )}
                {watermarkImageError && (
                  <p className="text-xs text-destructive">{watermarkImageError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  A PNG with a transparent background works best. The logo is scaled to at most
                  30% of the image.
                </p>
                <input
                  ref={watermarkInputRef}
                  type="file"
                  accept={TOOL_ACCEPTED_TYPES.watermark.join(",")}
                  onChange={handleWatermarkImageSelect}
                  className="hidden"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Opacity</Label>
              <span className="text-sm text-muted-foreground">{Math.round(opacity * 100)}%</span>
            </div>
            <Slider
              value={[opacity]}
              onValueChange={(v) => setOpacity(Array.isArray(v) ? v[0] : v)}
              min={0}
              max={1}
              step={0.01}
              aria-label="Opacity"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rotation</Label>
              <span className="text-sm text-muted-foreground">{rotation}&deg;</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={(v) => setRotation(Array.isArray(v) ? v[0] : v)}
              min={-180}
              max={180}
              step={1}
              aria-label="Rotation"
            />
          </div>

          <div className="space-y-2">
            <Label>Position</Label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Position">
                {POSITIONS.map((pos) => (
                  <Button
                    key={pos.value}
                    variant={position === pos.value ? "default" : "outline"}
                    size="sm"
                    className="h-10 w-10"
                    onClick={() => setPosition(pos.value)}
                    aria-label={pos.label}
                    aria-pressed={position === pos.value}
                    title={pos.label}
                  >
                    <span
                      className={
                        position === pos.value
                          ? "h-2 w-2 rounded-full bg-primary-foreground"
                          : "h-2 w-2 rounded-full bg-muted-foreground/60"
                      }
                    />
                  </Button>
                ))}
              </div>
              <Button
                variant={position === "tile" ? "default" : "outline"}
                size="sm"
                className="h-10"
                onClick={() => setPosition("tile")}
                aria-pressed={position === "tile"}
              >
                Repeat across the image
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {position === "tile"
                ? "The watermark is repeated in a grid over the whole picture. Good against cropping."
                : `Placed at the ${POSITIONS.find((p) => p.value === position)?.label.toLowerCase()}.`}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isBusy ? "Applying..." : "Apply watermark"}
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
