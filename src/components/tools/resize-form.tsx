"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useProcessing } from "@/hooks/use-processing";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { ImagePreview } from "@/components/shared/image-preview";
import { ProcessingStatus } from "@/components/shared/processing-status";
import { DownloadButton, DownloadAllButton } from "@/components/shared/download-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CROP_PRESETS, UPLOAD_LIMITS, TOOL_ACCEPTED_TYPES } from "@/lib/constants";
import { Lock, Unlock, Crop, Maximize2 } from "lucide-react";

type CropPreset = keyof typeof CROP_PRESETS;

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CANVAS_W = 600;
const CANVAS_H = 400;

export function ResizeForm() {
  const { isSignedIn } = useUser();
  const limits = isSignedIn ? UPLOAD_LIMITS.authenticated : UPLOAD_LIMITS.anonymous;

  const [activeTab, setActiveTab] = useState<"resize" | "crop">("resize");

  // Resize state
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [percentage, setPercentage] = useState<number | "">(100);
  const [resizeMode, setResizeMode] = useState<"dimensions" | "percentage">("dimensions");

  // Crop state
  const [cropPreset, setCropPreset] = useState<CropPreset>("free");
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // The decoded first file, tagged with the File it belongs to so a stale
  // image is never used after the selection changes.
  const [loaded, setLoaded] = useState<{ file: File; img: HTMLImageElement } | null>(null);

  const { files, previews, setFiles, addFiles, removeFile, clearFiles } =
    useImageUpload({ maxFiles: limits.maxFiles });
  const { processImage, processBatch, status, progress, result, results, error, reset: resetProcessing } =
    useProcessing();

  const isBusy = status === "processing" || status === "uploading";

  const cropImage = loaded && files[0] === loaded.file ? loaded.img : null;
  const imageDimensions = useMemo(
    () =>
      cropImage
        ? { width: cropImage.naturalWidth, height: cropImage.naturalHeight }
        : { width: 0, height: 0 },
    [cropImage]
  );
  const originalAspectRatio =
    imageDimensions.height > 0 ? imageDimensions.width / imageDimensions.height : 1;

  // Decode the first file once so the crop canvas and the size hints can use it
  useEffect(() => {
    if (files.length === 0) return;

    const file = files[0];
    const url = URL.createObjectURL(file);
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      setCropArea({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
      setLoaded({ file, img });
    };
    img.src = url;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [files]);

  // Draw the crop overlay
  useEffect(() => {
    if (activeTab !== "crop" || !canvasRef.current || !cropImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = cropImage;
    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cropX = offsetX + (cropArea.x / img.naturalWidth) * drawWidth;
    const cropY = offsetY + (cropArea.y / img.naturalHeight) * drawHeight;
    const cropW = (cropArea.width / img.naturalWidth) * drawWidth;
    const cropH = (cropArea.height / img.naturalHeight) * drawHeight;

    ctx.clearRect(cropX, cropY, cropW, cropH);
    ctx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, cropX, cropY, cropW, cropH);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cropX + (cropW * i) / 3, cropY);
      ctx.lineTo(cropX + (cropW * i) / 3, cropY + cropH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cropX, cropY + (cropH * i) / 3);
      ctx.lineTo(cropX + cropW, cropY + (cropH * i) / 3);
      ctx.stroke();
    }
  }, [activeTab, cropImage, cropArea]);

  const handleWidthChange = (value: string) => {
    const numValue = value === "" ? "" : parseInt(value, 10);
    setWidth(numValue);
    if (lockAspectRatio && numValue !== "" && !isNaN(numValue) && originalAspectRatio) {
      setHeight(Math.max(1, Math.round(numValue / originalAspectRatio)));
    }
  };

  const handleHeightChange = (value: string) => {
    const numValue = value === "" ? "" : parseInt(value, 10);
    setHeight(numValue);
    if (lockAspectRatio && numValue !== "" && !isNaN(numValue) && originalAspectRatio) {
      setWidth(Math.max(1, Math.round(numValue * originalAspectRatio)));
    }
  };

  const applyCropPreset = (preset: CropPreset) => {
    setCropPreset(preset);
    if (preset === "free" || imageDimensions.width === 0) return;

    const ratio = CROP_PRESETS[preset].ratio;
    if (ratio === 0) return;

    const imgW = imageDimensions.width;
    const imgH = imageDimensions.height;
    let cropW: number;
    let cropH: number;

    if (imgW / imgH > ratio) {
      cropH = imgH;
      cropW = Math.round(imgH * ratio);
    } else {
      cropW = imgW;
      cropH = Math.round(imgW / ratio);
    }

    setCropArea({
      x: Math.round((imgW - cropW) / 2),
      y: Math.round((imgH - cropH) / 2),
      width: cropW,
      height: cropH,
    });
  };

  const canvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart(canvasPoint(e));
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging || !canvasRef.current) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      const current = canvasPoint(e);

      const imgW = imageDimensions.width;
      const imgH = imageDimensions.height;
      if (!imgW || !imgH) return;
      const scale = Math.min(canvas.width / imgW, canvas.height / imgH);
      const drawWidth = imgW * scale;
      const drawHeight = imgH * scale;
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      const clampX = (v: number) => Math.min(imgW, Math.max(0, v));
      const clampY = (v: number) => Math.min(imgH, Math.max(0, v));
      const startImgX = clampX(Math.round(((dragStart.x - offsetX) / drawWidth) * imgW));
      const startImgY = clampY(Math.round(((dragStart.y - offsetY) / drawHeight) * imgH));
      const endImgX = clampX(Math.round(((current.x - offsetX) / drawWidth) * imgW));
      const endImgY = clampY(Math.round(((current.y - offsetY) / drawHeight) * imgH));

      const x = Math.min(startImgX, endImgX);
      const y = Math.min(startImgY, endImgY);
      let w = Math.abs(endImgX - startImgX);
      let h = Math.abs(endImgY - startImgY);

      if (cropPreset !== "free") {
        const ratio = CROP_PRESETS[cropPreset].ratio;
        if (ratio > 0) {
          if (w / h > ratio) {
            w = Math.round(h * ratio);
          } else {
            h = Math.round(w / ratio);
          }
        }
      }

      // Keep the box inside the image after the ratio adjustment
      w = Math.min(w, imgW - x);
      h = Math.min(h, imgH - y);

      if (w > 0 && h > 0) {
        setCropArea({ x, y, width: w, height: h });
      }
    },
    [isDragging, dragStart, imageDimensions, cropPreset]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    canvasRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  const buildOptions = () => {
    if (activeTab === "resize") {
      if (resizeMode === "percentage") {
        return JSON.stringify({ mode: "percentage", percentage: percentage || 100, lockAspectRatio });
      }
      return JSON.stringify({
        mode: "exact",
        width: width || undefined,
        height: height || undefined,
        lockAspectRatio,
      });
    }
    return JSON.stringify({ mode: "crop", lockAspectRatio: false, cropPreset, cropArea });
  };

  const resizeInputsValid =
    activeTab === "crop" ||
    (resizeMode === "percentage" ? percentage !== "" && percentage > 0 : width !== "" || height !== "");

  const handleSubmit = async () => {
    if (files.length === 0 || !resizeInputsValid) return;
    const options = buildOptions();

    if (files.length === 1 || activeTab === "crop") {
      const formData = new FormData();
      formData.append("files", files[0]);
      formData.append("options", options);
      await processImage("/api/process/resize", formData);
    } else {
      await processBatch(
        "/api/process/resize",
        (file) => {
          const formData = new FormData();
          formData.append("files", file);
          formData.append("options", options);
          return formData;
        },
        files
      );
    }
  };

  const handleReset = () => {
    clearFiles();
    resetProcessing();
    setWidth("");
    setHeight("");
    setPercentage(100);
    setLockAspectRatio(true);
    setCropPreset("free");
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    setResizeMode("dimensions");
  };

  return (
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={setFiles}
        onFilesAdded={addFiles}
        maxFiles={limits.maxFiles}
        maxFileSize={limits.maxFileSize}
        accept={[...TOOL_ACCEPTED_TYPES.resize]}
        isSignedIn={!!isSignedIn}
        selectedFiles={files}
        onRemoveFile={removeFile}
      />

      {files.length > 0 && (
        <>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "resize" | "crop")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resize" className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Resize
              </TabsTrigger>
              <TabsTrigger value="crop" className="flex items-center gap-2">
                <Crop className="h-4 w-4" />
                Crop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resize" className="mt-4 space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={resizeMode === "dimensions" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResizeMode("dimensions")}
                  aria-pressed={resizeMode === "dimensions"}
                >
                  By pixels
                </Button>
                <Button
                  variant={resizeMode === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResizeMode("percentage")}
                  aria-pressed={resizeMode === "percentage"}
                >
                  By percentage
                </Button>
              </div>

              {resizeMode === "dimensions" ? (
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="width-input">Width (px)</Label>
                      <Input
                        id="width-input"
                        type="number"
                        min={1}
                        max={10000}
                        placeholder={String(imageDimensions.width || "Width")}
                        value={width}
                        onChange={(e) => handleWidthChange(e.target.value)}
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="mb-0.5 shrink-0"
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                      title={lockAspectRatio ? "Unlock the aspect ratio" : "Lock the aspect ratio"}
                      aria-label={lockAspectRatio ? "Unlock the aspect ratio" : "Lock the aspect ratio"}
                    >
                      {lockAspectRatio ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </Button>

                    <div className="flex-1 space-y-2">
                      <Label htmlFor="height-input">Height (px)</Label>
                      <Input
                        id="height-input"
                        type="number"
                        min={1}
                        max={10000}
                        placeholder={String(imageDimensions.height || "Height")}
                        value={height}
                        onChange={(e) => handleHeightChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="lock-aspect" checked={lockAspectRatio} onCheckedChange={setLockAspectRatio} />
                    <Label htmlFor="lock-aspect">Keep the aspect ratio</Label>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {imageDimensions.width > 0 && (
                      <>Original: {imageDimensions.width} x {imageDimensions.height} px. </>
                    )}
                    {lockAspectRatio
                      ? "Fill in one side and the other follows. With both sides set, the image fits inside the box."
                      : "The image is stretched to exactly the width and height you enter."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="percentage-input">Scale (%)</Label>
                    <Input
                      id="percentage-input"
                      type="number"
                      min={1}
                      max={500}
                      value={percentage}
                      onChange={(e) =>
                        setPercentage(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                      }
                    />
                  </div>

                  {imageDimensions.width > 0 && percentage !== "" && (
                    <p className="text-xs text-muted-foreground">
                      Result: {Math.round(imageDimensions.width * (percentage / 100))} x{" "}
                      {Math.round(imageDimensions.height * (percentage / 100))} px
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="crop" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Aspect ratio</Label>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Aspect ratio">
                  {(Object.keys(CROP_PRESETS) as CropPreset[]).map((key) => (
                    <Button
                      key={key}
                      variant={cropPreset === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyCropPreset(key)}
                      aria-pressed={cropPreset === key}
                    >
                      {CROP_PRESETS[key].label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Crop area</Label>
                <p className="text-xs text-muted-foreground">
                  Drag on the picture to draw the area, or type the values below.
                  {files.length > 1 && " Crop applies to the first file only."}
                </p>
                <div className="flex items-center justify-center rounded-lg border bg-muted/50 p-2">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="max-w-full cursor-crosshair touch-none rounded"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    aria-label="Crop area selector"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="crop-x">X</Label>
                  <Input
                    id="crop-x"
                    type="number"
                    min={0}
                    max={imageDimensions.width > 0 ? imageDimensions.width - 1 : undefined}
                    value={Math.round(cropArea.x)}
                    onChange={(e) => {
                      const v = Math.min(parseInt(e.target.value, 10) || 0, Math.max(0, imageDimensions.width - 1));
                      setCropArea((prev) => ({ ...prev, x: Math.max(0, v) }));
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="crop-y">Y</Label>
                  <Input
                    id="crop-y"
                    type="number"
                    min={0}
                    max={imageDimensions.height > 0 ? imageDimensions.height - 1 : undefined}
                    value={Math.round(cropArea.y)}
                    onChange={(e) => {
                      const v = Math.min(parseInt(e.target.value, 10) || 0, Math.max(0, imageDimensions.height - 1));
                      setCropArea((prev) => ({ ...prev, y: Math.max(0, v) }));
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="crop-w">Width</Label>
                  <Input
                    id="crop-w"
                    type="number"
                    min={1}
                    max={imageDimensions.width > 0 ? imageDimensions.width - cropArea.x : undefined}
                    value={Math.round(cropArea.width)}
                    onChange={(e) => {
                      const maxW = imageDimensions.width > 0 ? imageDimensions.width - cropArea.x : Infinity;
                      const v = Math.min(parseInt(e.target.value, 10) || 1, maxW);
                      setCropArea((prev) => ({ ...prev, width: Math.max(1, v) }));
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="crop-h">Height</Label>
                  <Input
                    id="crop-h"
                    type="number"
                    min={1}
                    max={imageDimensions.height > 0 ? imageDimensions.height - cropArea.y : undefined}
                    value={Math.round(cropArea.height)}
                    onChange={(e) => {
                      const maxH = imageDimensions.height > 0 ? imageDimensions.height - cropArea.y : Infinity;
                      const v = Math.min(parseInt(e.target.value, 10) || 1, maxH);
                      setCropArea((prev) => ({ ...prev, height: Math.max(1, v) }));
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <ImagePreview
            originalSrc={previews[0]}
            processedSrc={result ? `${result.downloadUrl}&inline=true` : undefined}
            originalMeta={
              files[0]
                ? {
                    fileName: files[0].name,
                    width: imageDimensions.width || undefined,
                    height: imageDimensions.height || undefined,
                    size: files[0].size,
                  }
                : undefined
            }
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
        </>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={files.length === 0 || isBusy || !resizeInputsValid}>
          {isBusy
            ? `Processing${files.length > 1 && activeTab === "resize" ? ` ${results.length + 1} of ${files.length}` : ""}...`
            : activeTab === "resize"
              ? files.length > 1
                ? `Resize ${files.length} images`
                : "Resize"
              : "Crop"}
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
          zipName="imageforge-resized.zip"
        />
      )}

      {results.length === 1 && result && (
        <DownloadButton downloadUrl={result.downloadUrl} fileName={result.outputMeta.fileName} />
      )}
    </div>
  );
}
