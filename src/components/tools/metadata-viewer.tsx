"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useProcessing } from "@/hooks/use-processing";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { ProcessingStatus } from "@/components/shared/processing-status";
import { DownloadButton } from "@/components/shared/download-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, FileImage, ShieldOff, Loader2 } from "lucide-react";
import { UPLOAD_LIMITS, TOOL_ACCEPTED_TYPES } from "@/lib/constants";

interface MetadataResponse {
  format: string;
  width: number;
  height: number;
  size: number;
  space: string;
  channels: number;
  depth: string;
  density?: number;
  hasAlpha: boolean;
  exif: Record<string, unknown>;
  gps?: { latitude: number; longitude: number };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatExifValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const EXIF_LABELS: Record<string, string> = {
  Make: "Camera Make",
  Model: "Camera Model",
  DateTime: "Date/Time",
  DateTimeOriginal: "Date Taken",
  ExposureTime: "Exposure Time",
  FNumber: "F-Number",
  ISOSpeedRatings: "ISO",
  ISO: "ISO",
  FocalLength: "Focal Length",
  FocalLengthIn35mmFilm: "Focal Length (35mm)",
  ExposureProgram: "Exposure Program",
  MeteringMode: "Metering Mode",
  Flash: "Flash",
  WhiteBalance: "White Balance",
  Software: "Software",
  Orientation: "Orientation",
  XResolution: "X Resolution",
  YResolution: "Y Resolution",
  ResolutionUnit: "Resolution Unit",
  ColorSpace: "Color Space",
  ExifImageWidth: "EXIF Width",
  ExifImageHeight: "EXIF Height",
  LensModel: "Lens Model",
  LensMake: "Lens Make",
  Artist: "Artist",
  Copyright: "Copyright",
  ImageDescription: "Description",
};

export function MetadataViewer() {
  const { isSignedIn } = useUser();
  const limits = isSignedIn ? UPLOAD_LIMITS.authenticated : UPLOAD_LIMITS.anonymous;

  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [readingMetadata, setReadingMetadata] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const { files, setFiles, removeFile, clearFiles } = useImageUpload();
  const {
    processImage,
    status: stripStatus,
    progress: stripProgress,
    result: stripResult,
    error: stripError,
    reset: resetStrip,
  } = useProcessing();

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setMetadata(null);
    setReadError(null);
    resetStrip();

    if (selectedFiles.length === 0) return;

    setReadingMetadata(true);
    try {
      const formData = new FormData();
      formData.append("files", selectedFiles[0]);
      formData.append("options", JSON.stringify({ action: "read" }));

      const response = await fetch("/api/process/metadata", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to read metadata (${response.status})`);
      }

      const data = await response.json();
      setMetadata(data.metadata);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : "Failed to read metadata");
    } finally {
      setReadingMetadata(false);
    }
  };

  const handleStrip = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("files", files[0]);
    formData.append("options", JSON.stringify({ action: "strip" }));

    await processImage("/api/process/metadata", formData);
  };

  const handleReset = () => {
    clearFiles();
    setMetadata(null);
    setReadError(null);
    resetStrip();
  };

  const exifEntries = metadata?.exif
    ? Object.entries(metadata.exif).filter(
        ([, value]) => value !== null && value !== undefined
      )
    : [];

  return (
    <div className="space-y-6">
      <ImageDropzone
        onFilesSelected={handleFilesSelected}
        maxFiles={1}
        maxFileSize={limits.maxFileSize}
        accept={[...TOOL_ACCEPTED_TYPES.metadata]}
        isSignedIn={!!isSignedIn}
        selectedFiles={files}
        onRemoveFile={(index) => {
          removeFile(index);
          setMetadata(null);
          setReadError(null);
          resetStrip();
        }}
      />

      {readingMetadata && (
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Reading metadata...</span>
        </div>
      )}

      {readError && (
        <div className="rounded-lg border border-destructive/50 p-4">
          <p className="text-sm text-destructive">{readError}</p>
        </div>
      )}

      {metadata && (
        <div className="space-y-6">
          {/* Basic Image Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileImage className="h-5 w-5" />
                Image Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Property</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Format</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{metadata.format.toUpperCase()}</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Dimensions</TableCell>
                    <TableCell>{metadata.width} x {metadata.height} px</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">File Size</TableCell>
                    <TableCell>{formatFileSize(metadata.size)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Color Space</TableCell>
                    <TableCell>{metadata.space}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Channels</TableCell>
                    <TableCell>{metadata.channels}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bit Depth</TableCell>
                    <TableCell>{metadata.depth}</TableCell>
                  </TableRow>
                  {metadata.density && (
                    <TableRow>
                      <TableCell className="font-medium">DPI</TableCell>
                      <TableCell>{metadata.density}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-medium">Alpha Channel</TableCell>
                    <TableCell>{metadata.hasAlpha ? "Yes" : "No"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* EXIF Data */}
          {exifEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5" />
                  EXIF Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Property</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exifEntries.map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">
                          {EXIF_LABELS[key] || key}
                        </TableCell>
                        <TableCell className="break-all">
                          {formatExifValue(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* GPS Data */}
          {metadata.gps && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  GPS Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Property</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Latitude</TableCell>
                      <TableCell>{metadata.gps.latitude.toFixed(6)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Longitude</TableCell>
                      <TableCell>{metadata.gps.longitude.toFixed(6)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Strip Metadata Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldOff className="h-5 w-5" />
                Strip Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Remove all EXIF data, GPS coordinates, and other metadata from your image for privacy.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={handleStrip}
                  disabled={stripStatus === "processing" || stripStatus === "uploading"}
                >
                  {stripStatus === "processing" || stripStatus === "uploading"
                    ? "Stripping..."
                    : "Strip Metadata"}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>

              <ProcessingStatus
                status={stripStatus}
                progress={stripProgress}
                errorMessage={stripError ?? undefined}
              />

              {stripResult && (
                <DownloadButton
                  downloadUrl={stripResult.downloadUrl}
                  fileName={files[0]?.name.replace(/\.([^.]+)$/, "-stripped.$1") || "stripped-image"}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
