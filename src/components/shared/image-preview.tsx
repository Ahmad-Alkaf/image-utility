"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  originalSrc?: string;
  processedSrc?: string;
  originalMeta?: {
    fileName: string;
    width?: number;
    height?: number;
    size: number;
  };
  processedMeta?: {
    fileName: string;
    width?: number;
    height?: number;
    size: number;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagePreview({
  originalSrc,
  processedSrc,
  originalMeta,
  processedMeta,
}: ImagePreviewProps) {
  const [mode, setMode] = useState<"side-by-side" | "slider">("side-by-side");
  const [zoom, setZoom] = useState(1);
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (!originalSrc) return null;

  return (
    <div className="space-y-4">
      {processedSrc && (
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as typeof mode)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
            <TabsTrigger value="slider">Slider</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(1)}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {mode === "side-by-side" ? (
        <div
          className={cn(
            "grid gap-4",
            processedSrc ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          )}
        >
          <div className="space-y-2">
            <Badge variant="outline">Original</Badge>
            <div className="overflow-auto rounded-lg border bg-[url('/checkerboard.svg')] bg-repeat max-h-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalSrc}
                alt="Original"
                className="mx-auto"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
              />
            </div>
            {originalMeta && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{originalMeta.fileName}</span>
                {originalMeta.width && originalMeta.height && (
                  <span>
                    {originalMeta.width} x {originalMeta.height}
                  </span>
                )}
                <span>{formatFileSize(originalMeta.size)}</span>
              </div>
            )}
          </div>

          {processedSrc && (
            <div className="space-y-2">
              <Badge>Processed</Badge>
              <div className="overflow-auto rounded-lg border bg-[url('/checkerboard.svg')] bg-repeat max-h-96">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={processedSrc}
                  alt="Processed"
                  className="mx-auto"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                />
              </div>
              {processedMeta && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{processedMeta.fileName}</span>
                  {processedMeta.width && processedMeta.height && (
                    <span>
                      {processedMeta.width} x {processedMeta.height}
                    </span>
                  )}
                  <span>{formatFileSize(processedMeta.size)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        processedSrc && (
          <div
            ref={sliderRef}
            className="relative overflow-hidden rounded-lg border cursor-col-resize select-none max-h-96"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={processedSrc}
              alt="Processed"
              className="w-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalSrc}
                alt="Original"
                className="w-full"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  width: containerWidth
                    ? `${containerWidth}px`
                    : "100%",
                }}
              />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg p-1.5">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-4 bg-gray-400 rounded" />
                  <div className="w-0.5 h-4 bg-gray-400 rounded" />
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
