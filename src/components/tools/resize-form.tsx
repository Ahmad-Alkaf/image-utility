"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(1);

  // Crop state
  const [cropPreset, setCropPreset] = useState<CropPreset>("free");
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { files, previews, setFiles, removeFile, clearFiles } = useImageUpload({ maxFiles: limits.maxFiles });
  const { processImage, processBatch, status, progress, result, results, error, reset: resetProcessing } = useProcessing();

  // Load image dimensions when file changes
  useEffect(() => {
    if (files.length === 0) return;

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setOriginalAspectRatio(img.naturalWidth / img.naturalHeight);
      setCropArea({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = URL.createObjectURL(files[0]);

    return () => URL.revokeObjectURL(img.src);
  }, [files]);

  // Draw crop overlay on canvas
  useEffect(() => {
    if (activeTab !== "crop" || !canvasRef.current || files.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const drawWidth = img.naturalWidth * scale;
      const drawHeight = img.naturalHeight * scale;
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Draw dark overlay outside crop area
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear crop area to show image
      const cropX = offsetX + (cropArea.x / img.naturalWidth) * drawWidth;
      const cropY = offsetY + (cropArea.y / img.naturalHeight) * drawHeight;
      const cropW = (cropArea.width / img.naturalWidth) * drawWidth;
      const cropH = (cropArea.height / img.naturalHeight) * drawHeight;

      ctx.clearRect(cropX, cropY, cropW, cropH);
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        cropX,
        cropY,
        cropW,
        cropH
      );

      // Draw crop border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(cropX, cropY, cropW, cropH);

      // Draw grid lines (rule of thirds)
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
    };
    img.src = URL.createObjectURL(files[0]);

    return () => URL.revokeObjectURL(img.src);
  }, [activeTab, files, cropArea]);

  const handleWidthChange = (value: string) => {
    const numValue = value === "" ? "" : parseInt(value, 10);
    setWidth(numValue);

    if (lockAspectRatio && numValue !== "" && !isNaN(numValue) && originalAspectRatio) {
      setHeight(Math.round(numValue / originalAspectRatio));
    }
  };

  const handleHeightChange = (value: string) => {
    const numValue = value === "" ? "" : parseInt(value, 10);
    setHeight(numValue);

    if (lockAspectRatio && numValue !== "" && !isNaN(numValue) && originalAspectRatio) {
      setWidth(Math.round(numValue * originalAspectRatio));
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

    const x = Math.round((imgW - cropW) / 2);
    const y = Math.round((imgH - cropH) / 2);

    setCropArea({ x, y, width: cropW, height: cropH });
  };

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const imgW = imageDimensions.width;
      const imgH = imageDimensions.height;
      const scale = Math.min(canvas.width / imgW, canvas.height / imgH);
      const drawWidth = imgW * scale;
      const drawHeight = imgH * scale;
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      const startImgX = Math.max(0, Math.round(((dragStart.x - offsetX) / drawWidth) * imgW));
      const startImgY = Math.max(0, Math.round(((dragStart.y - offsetY) / drawHeight) * imgH));
      const endImgX = Math.min(imgW, Math.round(((currentX - offsetX) / drawWidth) * imgW));
      const endImgY = Math.min(imgH, Math.round(((currentY - offsetY) / drawHeight) * imgH));

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

      if (w > 0 && h > 0) {
        setCropArea({ x, y, width: w, height: h });
      }
    },
    [isDragging, dragStart, imageDimensions, cropPreset]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const buildOptions = () => {
    if (activeTab === "resize") {
      if (resizeMode === "percentage") {
        return JSON.stringify({
          mode: "percentage",
          percentage: percentage || 100,
          lockAspectRatio,
        });
      } else {
        return JSON.stringify({
          mode: "exact",
          width: width || undefined,
          height: height || undefined,
          lockAspectRatio,
        });
      }
    } else {
      return JSON.stringify({
        mode: "crop",
        lockAspectRatio: false,
        cropPreset,
        cropArea,
      });
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    const options = buildOptions();

    if (files.length === 1 || activeTab === "crop") {
      // Crop mode only works on first file
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

            <TabsContent value="resize" className="space-y-4 mt-4">
              <div className="flex gap-3">
                <Button
                  variant={resizeMode === "dimensions" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResizeMode("dimensions")}
                >
                  Exact Dimensions
                </Button>
                <Button
                  variant={resizeMode === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResizeMode("percentage")}
                >
                  Percentage
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
                      className="shrink-0 mb-0.5"
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                      title={lockAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                    >
                      {lockAspectRatio ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
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
                    <Switch
                      id="lock-aspect"
                      checked={lockAspectRatio}
                      onCheckedChange={setLockAspectRatio}
                    />
                    <Label htmlFor="lock-aspect">Lock aspect ratio</Label>
                  </div>

                  {imageDimensions.width > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Original: {imageDimensions.width} x {imageDimensions.height} px
                    </p>
                  )}
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

            <TabsContent value="crop" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Aspect Ratio Preset</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CROP_PRESETS) as CropPreset[]).map((key) => (
                    <Button
                      key={key}
                      variant={cropPreset === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyCropPreset(key)}
                    >
                      {CROP_PRESETS[key].label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Crop Area (drag on image to select)</Label>
                <div className="rounded-lg border bg-muted/50 p-2 flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={400}
                    className="max-w-full cursor-crosshair rounded"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">X</Label>
                  <Input
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
                  <Label className="text-xs">Y</Label>
                  <Input
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
                  <Label className="text-xs">Width</Label>
                  <Input
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
                  <Label className="text-xs">Height</Label>
                  <Input
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
          />
        </>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || status === "processing" || status === "uploading"}
        >
          {status === "processing" || status === "uploading"
            ? `Processing${files.length > 1 ? ` (${results.length}/${files.length})` : ""}...`
            : activeTab === "resize"
              ? "Resize"
              : "Crop"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <ProcessingStatus status={status} progress={progress} errorMessage={error ?? undefined} />

      {results.length > 1 && (
        <DownloadAllButton
          files={results.map((r, i) => ({
            url: r.downloadUrl,
            name: r.outputMeta.fileName || `resized-${i + 1}`,
          }))}
        />
      )}

      {results.length === 1 && result && (
        <DownloadButton
          downloadUrl={result.downloadUrl}
          fileName={`${activeTab === "resize" ? "resized" : "cropped"}-${files[0]?.name || "image"}`}
        />
      )}
    </div>
  );
}
