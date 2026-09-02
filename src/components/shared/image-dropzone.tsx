"use client";

import { useCallback, useId, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Upload, X, FileImage, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";

interface ImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onFilesAdded?: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  accept: string[];
  disabled?: boolean;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
  isSignedIn?: boolean;
}

function formatList(accept: string[]): string {
  return [
    ...new Set(
      accept
        .map((t) => t.replace("image/", "").replace("svg+xml", "SVG"))
        .filter((name) => name !== "jpg")
        .map((name) => (name === "SVG" ? name : name.toUpperCase()))
    ),
  ].join(", ");
}

export function ImageDropzone({
  onFilesSelected,
  onFilesAdded,
  maxFiles = 1,
  maxFileSize,
  accept,
  disabled = false,
  selectedFiles = [],
  onRemoveFile,
  isSignedIn = false,
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [rejectMessage, setRejectMessage] = useState<string | null>(null);
  const fileInputId = useId();

  const limits = isSignedIn ? UPLOAD_LIMITS.authenticated : UPLOAD_LIMITS.anonymous;
  const effectiveMaxFileSize = maxFileSize ?? limits.maxFileSize;
  const effectiveMaxFiles = Math.min(maxFiles, limits.maxFiles);
  const maxSizeMB = Math.round(effectiveMaxFileSize / (1024 * 1024));

  /** Splits the incoming list into accepted files and a message about the rest. */
  const filterFiles = useCallback(
    (incoming: File[]): File[] => {
      const wrongType = incoming.filter((f) => !accept.includes(f.type));
      const tooBig = incoming.filter((f) => accept.includes(f.type) && f.size > effectiveMaxFileSize);
      const ok = incoming.filter((f) => accept.includes(f.type) && f.size <= effectiveMaxFileSize);

      const problems: string[] = [];
      if (wrongType.length) {
        problems.push(
          `${wrongType.length === 1 ? `"${wrongType[0].name}" is` : `${wrongType.length} files are`} not a supported type (${formatList(accept)}).`
        );
      }
      if (tooBig.length) {
        problems.push(
          `${tooBig.length === 1 ? `"${tooBig[0].name}" is` : `${tooBig.length} files are`} larger than ${maxSizeMB} MB${isSignedIn ? "" : ". Sign in to upload up to " + UPLOAD_LIMITS.authenticated.maxFileSize / (1024 * 1024) + " MB"}.`
        );
      }
      if (ok.length > effectiveMaxFiles) {
        problems.push(`Only the first ${effectiveMaxFiles} file${effectiveMaxFiles === 1 ? "" : "s"} ${effectiveMaxFiles === 1 ? "was" : "were"} kept.`);
      }
      setRejectMessage(problems.length ? problems.join(" ") : null);
      return ok;
    },
    [accept, effectiveMaxFileSize, effectiveMaxFiles, isSignedIn, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const files = filterFiles(Array.from(e.dataTransfer.files));
      if (files.length > 0) {
        onFilesSelected(files.slice(0, effectiveMaxFiles));
      }
    },
    [disabled, effectiveMaxFiles, filterFiles, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files) return;
      const files = filterFiles(Array.from(e.target.files));
      if (files.length > 0) {
        if (selectedFiles.length > 0 && onFilesAdded) {
          onFilesAdded(files.slice(0, effectiveMaxFiles - selectedFiles.length));
        } else {
          onFilesSelected(files.slice(0, effectiveMaxFiles));
        }
      }
      e.target.value = "";
    },
    [disabled, effectiveMaxFiles, filterFiles, onFilesAdded, onFilesSelected, selectedFiles.length]
  );

  const openPicker = () => document.getElementById(fileInputId)?.click();

  return (
    <Card
      className={cn(
        "relative transition-colors",
        isDragOver && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-50"
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
            className="flex cursor-pointer flex-col items-center justify-center gap-4 p-12"
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPicker();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Choose image${effectiveMaxFiles > 1 ? "s" : ""}`}
          >
            <div className="rounded-lg border border-dashed border-foreground/15 p-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">
                Drop your image{effectiveMaxFiles > 1 ? "s" : ""} here
              </p>
              <p className="mt-1 text-sm text-muted-foreground">or click to choose a file</p>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">
                {effectiveMaxFiles > 1
                  ? `Up to ${effectiveMaxFiles} files, ${maxSizeMB} MB each`
                  : `Up to ${maxSizeMB} MB`}
              </p>
              <Popover>
                <PopoverTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Upload limits"
                >
                  <Info className="h-3.5 w-3.5" />
                </PopoverTrigger>
                <PopoverContent className="w-60 space-y-2 p-3 text-xs" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm font-medium">Upload limits</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>Size: up to {maxSizeMB} MB per file</p>
                    <p>Files: up to {effectiveMaxFiles} at a time</p>
                    <p>Formats: {formatList(accept)}</p>
                  </div>
                  {!isSignedIn && (
                    <p className="pt-1 text-primary">
                      Sign in for {UPLOAD_LIMITS.authenticated.maxFileSize / (1024 * 1024)} MB per file and up to {UPLOAD_LIMITS.authenticated.maxFiles} files.
                    </p>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            {rejectMessage && (
              <p className="max-w-md text-center text-xs text-destructive" role="alert">
                {rejectMessage}
              </p>
            )}
            <input
              id={fileInputId}
              type="file"
              accept={accept.join(",")}
              multiple={effectiveMaxFiles > 1}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <FileImage className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                {onRemoveFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => onRemoveFile(index)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {rejectMessage && (
              <p className="text-xs text-destructive" role="alert">
                {rejectMessage}
              </p>
            )}

            {effectiveMaxFiles > selectedFiles.length && (
              <Button variant="outline" size="sm" className="w-full" onClick={openPicker}>
                <Upload className="mr-2 h-4 w-4" />
                Add more files ({selectedFiles.length} of {effectiveMaxFiles})
              </Button>
            )}
            <input
              id={fileInputId}
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
