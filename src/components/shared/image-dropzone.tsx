"use client";

import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Upload, X, FileImage, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, UPLOAD_LIMITS } from "@/lib/constants";

interface ImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  accept?: string[];
  disabled?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
  isSignedIn?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageDropzone({
  onFilesSelected,
  maxFiles = 1,
  maxFileSize,
  accept = ACCEPTED_IMAGE_TYPES,
  disabled = false,
  uploading = false,
  uploadProgress = 0,
  selectedFiles = [],
  onRemoveFile,
  isSignedIn = false,
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const limits = isSignedIn ? UPLOAD_LIMITS.authenticated : UPLOAD_LIMITS.anonymous;
  const effectiveMaxFileSize = maxFileSize ?? limits.maxFileSize;
  const effectiveMaxFiles = Math.min(maxFiles, limits.maxFiles);
  const maxSizeMB = Math.round(effectiveMaxFileSize / (1024 * 1024));

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled || uploading) return;

      const files = Array.from(e.dataTransfer.files).filter(
        (f) => accept.includes(f.type) && f.size <= effectiveMaxFileSize
      );
      if (files.length > 0) {
        onFilesSelected(files.slice(0, effectiveMaxFiles));
      }
    },
    [accept, disabled, effectiveMaxFiles, effectiveMaxFileSize, onFilesSelected, uploading]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || uploading || !e.target.files) return;
      const files = Array.from(e.target.files).filter(
        (f) => accept.includes(f.type) && f.size <= effectiveMaxFileSize
      );
      if (files.length > 0) {
        onFilesSelected(files.slice(0, effectiveMaxFiles));
      }
      e.target.value = "";
    },
    [accept, disabled, effectiveMaxFiles, effectiveMaxFileSize, onFilesSelected, uploading]
  );

  return (
    <Card
      className={cn(
        "relative transition-colors",
        isDragOver && "border-primary bg-primary/5",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <CardContent className="p-0">
        {selectedFiles.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-4 p-12 cursor-pointer"
            onClick={() =>
              document.getElementById("file-input")?.click()
            }
          >
            <div className="rounded-lg border border-dashed border-foreground/15 p-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">
                Drop your image{effectiveMaxFiles > 1 ? "s" : ""} here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">
                {effectiveMaxFiles > 1
                  ? `Up to ${effectiveMaxFiles} files · max ${maxSizeMB} MB each`
                  : `Max ${maxSizeMB} MB`}
              </p>
              <Popover>
                <PopoverTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="h-3.5 w-3.5" />
                </PopoverTrigger>
                <PopoverContent
                  className="w-56 text-xs space-y-2 p-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-medium text-sm">Upload limits</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>Max file size: {maxSizeMB} MB per file</p>
                    <p>Max files: {effectiveMaxFiles}</p>
                    <p>Formats: PNG, JPEG, WebP, AVIF, TIFF, GIF, BMP</p>
                  </div>
                  {!isSignedIn && (
                    <p className="text-primary pt-1">
                      Sign in for {UPLOAD_LIMITS.authenticated.maxFileSize / (1024 * 1024)} MB per file and up to {UPLOAD_LIMITS.authenticated.maxFiles} files.
                    </p>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <input
              id="file-input"
              type="file"
              accept={accept.join(",")}
              multiple={effectiveMaxFiles > 1}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <FileImage className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {onRemoveFile && !uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => onRemoveFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {!uploading && effectiveMaxFiles > selectedFiles.length && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  document.getElementById("file-input")?.click()
                }
              >
                <Upload className="h-4 w-4 mr-2" />
                Add more files
              </Button>
            )}
            <input
              id="file-input"
              type="file"
              accept={accept.join(",")}
              multiple={effectiveMaxFiles > 1}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
