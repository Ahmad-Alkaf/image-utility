"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useProcessing } from "@/hooks/use-processing";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { ImagePreview } from "@/components/shared/image-preview";
import { ProcessingStatus } from "@/components/shared/processing-status";
import { DownloadButton } from "@/components/shared/download-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/constants";

const POSITIONS = [
  { value: "top-left", label: "TL", row: 0, col: 0 },
  { value: "top-center", label: "TC", row: 0, col: 1 },
  { value: "top-right", label: "TR", row: 0, col: 2 },
  { value: "center-left", label: "CL", row: 1, col: 0 },
  { value: "center", label: "C", row: 1, col: 1 },
  { value: "center-right", label: "CR", row: 1, col: 2 },
  { value: "bottom-left", label: "BL", row: 2, col: 0 },
  { value: "bottom-center", label: "BC", row: 2, col: 1 },
  { value: "bottom-right", label: "BR", row: 2, col: 2 },
];

export function WatermarkForm() {
  const { isSignedIn, isLoaded } = useUser();
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [text, setText] = useState("Watermark");
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState("bottom-right");
  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const {
    files,
    previews,
    setFiles,
    removeFile,
    clearFiles,
  } = useImageUpload();
  const {
    processImage,
    status,
    result,
    error,
    reset: resetProcessing,
  } = useProcessing();

  // Auth wall for unauthenticated users
  if (isLoaded && !isSignedIn) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-12">
          <div className="rounded-full bg-muted p-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">Sign in required</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please sign in to use the watermark tool.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (files.length === 0) return;

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
    setText("Watermark");
    setFontSize(48);
    setFontColor("#ffffff");
    setOpacity(0.5);
    setRotation(0);
    setPosition("bottom-right");
  };

  const handleWatermarkImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWatermarkImageFile(file);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={(selected) => setFiles(selected)}
        maxFiles={1}
        selectedFiles={files}
        onRemoveFile={removeFile}
      />

      {files.length > 0 && previews.length > 0 && (
        <ImagePreview
          originalSrc={previews[0]}
          originalMeta={{
            fileName: files[0].name,
            size: files[0].size,
          }}
        />
      )}

      <div className="space-y-4">
        <Tabs
          value={watermarkType}
          onValueChange={(v) => setWatermarkType(v as "text" | "image")}
        >
          <TabsList>
            <TabsTrigger value="text">Text Watermark</TabsTrigger>
            <TabsTrigger value="image">Image Watermark</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="watermark-text">Watermark Text</Label>
              <Input
                id="watermark-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter watermark text"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
                min={8}
                max={200}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-color">Font Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="font-color"
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border bg-transparent p-1"
                />
                <Input
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="w-32"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Watermark Image</Label>
              {watermarkImageFile ? (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="text-sm font-medium truncate flex-1">
                    {watermarkImageFile.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWatermarkImageFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => watermarkInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload watermark image
                </Button>
              )}
              <input
                ref={watermarkInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleWatermarkImageSelect}
                className="hidden"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label>Opacity: {opacity.toFixed(2)}</Label>
          <Slider
            value={[opacity]}
            onValueChange={(v) => setOpacity(Array.isArray(v) ? v[0] : v)}
            min={0}
            max={1}
            step={0.01}
          />
        </div>

        <div className="space-y-2">
          <Label>Rotation: {rotation}&deg;</Label>
          <Slider
            value={[rotation]}
            onValueChange={(v) => setRotation(Array.isArray(v) ? v[0] : v)}
            min={-180}
            max={180}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Position</Label>
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 gap-1">
              {POSITIONS.map((pos) => (
                <Button
                  key={pos.value}
                  variant={position === pos.value ? "default" : "outline"}
                  size="sm"
                  className="w-10 h-10 text-xs"
                  onClick={() => setPosition(pos.value)}
                >
                  {pos.label}
                </Button>
              ))}
            </div>
            <Button
              variant={position === "tile" ? "default" : "outline"}
              size="sm"
              className="h-10"
              onClick={() => setPosition("tile")}
            >
              Tile
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={
            files.length === 0 ||
            status === "processing" ||
            status === "uploading" ||
            (watermarkType === "text" && !text.trim()) ||
            (watermarkType === "image" && !watermarkImageFile)
          }
        >
          {status === "processing" || status === "uploading"
            ? "Applying..."
            : "Apply Watermark"}
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
          fileName={`watermarked-${files[0]?.name ?? "image.png"}`}
        />
      )}
    </div>
  );
}
