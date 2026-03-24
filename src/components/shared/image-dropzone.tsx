"use client";

import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

interface ImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  accept?: string[];
  disabled?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageDropzone({
  onFilesSelected,
  maxFiles = 1,
  accept = ACCEPTED_IMAGE_TYPES,
  disabled = false,
  uploading = false,
  uploadProgress = 0,
  selectedFiles = [],
  onRemoveFile,
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled || uploading) return;

      const files = Array.from(e.dataTransfer.files).filter(
        (f) => accept.includes(f.type) && f.size <= MAX_FILE_SIZE
      );
      if (files.length > 0) {
        onFilesSelected(files.slice(0, maxFiles));
      }
    },
    [accept, disabled, maxFiles, onFilesSelected, uploading]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || uploading || !e.target.files) return;
      const files = Array.from(e.target.files).filter(
        (f) => accept.includes(f.type) && f.size <= MAX_FILE_SIZE
      );
      if (files.length > 0) {
        onFilesSelected(files.slice(0, maxFiles));
      }
      e.target.value = "";
    },
    [accept, disabled, maxFiles, onFilesSelected, uploading]
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
                Drop your image{maxFiles > 1 ? "s" : ""} here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPEG, WebP, AVIF, TIFF, GIF, BMP
              {maxFiles > 1 ? ` · up to ${maxFiles} files` : ""} · max 50 MB
            </p>
            <input
              id="file-input"
              type="file"
              accept={accept.join(",")}
              multiple={maxFiles > 1}
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

            {!uploading && maxFiles > selectedFiles.length && (
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
              multiple={maxFiles > 1}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
