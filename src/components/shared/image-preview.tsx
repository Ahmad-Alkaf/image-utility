"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";

interface ImageMeta {
  fileName: string;
  width?: number;
  height?: number;
  size: number;
}

interface ImagePreviewProps {
  originalSrc?: string;
  processedSrc?: string;
  originalMeta?: ImageMeta;
  processedMeta?: ImageMeta;
}

function MetaLine({ meta }: { meta: ImageMeta }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      <span className="truncate" title={meta.fileName}>{meta.fileName}</span>
      {meta.width && meta.height ? (
        <span>{meta.width} x {meta.height} px</span>
      ) : null}
      <span>{formatFileSize(meta.size)}</span>
    </div>
  );
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

  const updateSlider = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = true;
      sliderRef.current?.setPointerCapture(e.pointerId);
      updateSlider(e.clientX);
    },
    [updateSlider]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      updateSlider(e.clientX);
    },
    [updateSlider]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    sliderRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  if (!originalSrc) return null;

  return (
    <div className="space-y-4">
      {processedSrc && (
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="side-by-side">Side by side</TabsTrigger>
            <TabsTrigger value="slider">Before and after</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-16 text-center text-sm text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setZoom(1)} aria-label="Reset zoom">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {mode === "side-by-side" || !processedSrc ? (
        <div
          className={cn(
            "grid gap-4",
            processedSrc ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          )}
        >
          <div className="space-y-2">
            <Badge variant="outline">Original</Badge>
            <div className="max-h-96 overflow-auto rounded-lg border bg-[url('/checkerboard.svg')] bg-repeat">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalSrc}
                alt="Original"
                className="mx-auto"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
              />
            </div>
            {originalMeta && <MetaLine meta={originalMeta} />}
          </div>

          {processedSrc && (
            <div className="space-y-2">
              <Badge>Result</Badge>
              <div className="max-h-96 overflow-auto rounded-lg border bg-[url('/checkerboard.svg')] bg-repeat">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={processedSrc}
                  alt="Result"
                  className="mx-auto"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                />
              </div>
              {processedMeta && <MetaLine meta={processedMeta} />}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div
            ref={sliderRef}
            className="relative max-h-96 cursor-col-resize touch-none select-none overflow-hidden rounded-lg border bg-[url('/checkerboard.svg')] bg-repeat"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="slider"
            aria-label="Drag to compare the original and the result"
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={processedSrc}
              alt="Result"
              className="w-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
              draggable={false}
            />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalSrc}
                alt="Original"
                className="w-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                draggable={false}
              />
            </div>
            <div
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
              style={{ left: `${sliderPosition}%` }}
            />
            <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
              Original
            </span>
            <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
              Result
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Drag left or right to compare.</p>
        </div>
      )}
    </div>
  );
}
