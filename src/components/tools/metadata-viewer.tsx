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
import { Camera, MapPin, FileImage, ShieldOff, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { UPLOAD_LIMITS, TOOL_ACCEPTED_TYPES } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";

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
  hasProfile: boolean;
  orientation?: number;
  exif: Record<string, unknown>;
  gps?: { latitude: number; longitude: number };
}

function formatExifValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (key === "ExposureTime" && typeof value === "number" && value > 0 && value < 1) {
    return `1/${Math.round(1 / value)} s`;
  }
  if (key === "FNumber" && typeof value === "number") return `f/${value}`;
  if ((key === "FocalLength" || key === "FocalLengthIn35mmFilm") && typeof value === "number") {
    return `${value} mm`;
  }
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const EXIF_LABELS: Record<string, string> = {
  Make: "Camera make",
  Model: "Camera model",
  DateTime: "Modified",
  DateTimeOriginal: "Taken",
  DateTimeDigitized: "Digitized",
  ExposureTime: "Exposure time",
  FNumber: "Aperture",
  ISOSpeedRatings: "ISO",
  ISO: "ISO",
  FocalLength: "Focal length",
  FocalLengthIn35mmFilm: "Focal length (35 mm)",
  ExposureProgram: "Exposure program",
  ExposureBiasValue: "Exposure bias",
  MeteringMode: "Metering mode",
  Flash: "Flash",
  WhiteBalance: "White balance",
  Software: "Software",
  Orientation: "Orientation",
  XResolution: "X resolution",
  YResolution: "Y resolution",
  ResolutionUnit: "Resolution unit",
  ColorSpace: "Color space",
  ExifImageWidth: "EXIF width",
  ExifImageHeight: "EXIF height",
  PixelXDimension: "Pixel width",
  PixelYDimension: "Pixel height",
  LensModel: "Lens model",
  LensMake: "Lens make",
  Artist: "Artist",
  Copyright: "Copyright",
  ImageDescription: "Description",
  OffsetTime: "Time zone",
  OffsetTimeOriginal: "Time zone (taken)",
};

/** Keys shown first, in this order. Everything else follows alphabetically. */
const PRIORITY_KEYS = [
  "Make",
  "Model",
  "LensModel",
  "DateTimeOriginal",
  "DateTime",
  "ExposureTime",
  "FNumber",
  "ISOSpeedRatings",
  "ISO",
  "FocalLength",
  "FocalLengthIn35mmFilm",
  "Flash",
  "WhiteBalance",
  "Software",
  "Artist",
  "Copyright",
];

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

      const response = await fetch("/api/process/metadata", { method: "POST", body: formData });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `The metadata could not be read (${response.status}).`);
      }

      const data = await response.json();
      setMetadata(data.metadata);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : "The metadata could not be read.");
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
    ? Object.entries(metadata.exif)
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .sort(([a], [b]) => {
          const ia = PRIORITY_KEYS.indexOf(a);
          const ib = PRIORITY_KEYS.indexOf(b);
          if (ia !== -1 || ib !== -1) {
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          }
          return a.localeCompare(b);
        })
    : [];

  const isStripping = stripStatus === "processing" || stripStatus === "uploading";
  const hasSensitiveData = !!metadata && (exifEntries.length > 0 || !!metadata.gps);

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
        <div className="flex items-center gap-3 rounded-lg border p-4" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Reading the metadata...</span>
        </div>
      )}

      {readError && (
        <div className="rounded-lg border border-destructive/50 p-4">
          <p className="text-sm text-destructive">{readError}</p>
        </div>
      )}

      {metadata && (
        <div className="space-y-6">
          {/* Summary */}
          <div
            className={
              hasSensitiveData
                ? "flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
                : "flex items-start gap-2 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm"
            }
          >
            {hasSensitiveData ? (
              <>
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  This image carries {exifEntries.length} metadata field{exifEntries.length === 1 ? "" : "s"}
                  {metadata.gps ? " and a GPS location" : ""}. Remove them before you share the file if you
                  want to keep that private.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <p>No EXIF metadata or GPS location was found in this image.</p>
              </>
            )}
          </div>

          {/* Basic image info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileImage className="h-5 w-5" />
                Image information
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
                    <TableCell className="font-medium">File size</TableCell>
                    <TableCell>{formatFileSize(metadata.size)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Color space</TableCell>
                    <TableCell>{metadata.space}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Channels</TableCell>
                    <TableCell>{metadata.channels}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bit depth</TableCell>
                    <TableCell>{metadata.depth}</TableCell>
                  </TableRow>
                  {metadata.density ? (
                    <TableRow>
                      <TableCell className="font-medium">Resolution</TableCell>
                      <TableCell>{metadata.density} DPI</TableCell>
                    </TableRow>
                  ) : null}
                  {metadata.orientation && metadata.orientation !== 1 ? (
                    <TableRow>
                      <TableCell className="font-medium">Orientation tag</TableCell>
                      <TableCell>{metadata.orientation}</TableCell>
                    </TableRow>
                  ) : null}
                  <TableRow>
                    <TableCell className="font-medium">Transparency</TableCell>
                    <TableCell>{metadata.hasAlpha ? "Yes" : "No"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Embedded color profile</TableCell>
                    <TableCell>{metadata.hasProfile ? "Yes" : "No"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* EXIF data */}
          {exifEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5" />
                  EXIF data
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
                        <TableCell className="font-medium">{EXIF_LABELS[key] || key}</TableCell>
                        <TableCell className="break-all">{formatExifValue(key, value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* GPS data */}
          {metadata.gps && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  GPS location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <a
                  href={`https://www.openstreetmap.org/?mlat=${metadata.gps.latitude}&mlon=${metadata.gps.longitude}#map=15/${metadata.gps.latitude}/${metadata.gps.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
                >
                  Show on a map
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </CardContent>
            </Card>
          )}

          {/* Strip metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldOff className="h-5 w-5" />
                Remove metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Makes a copy of the image without EXIF data, GPS coordinates, camera details, or
                other embedded metadata. The pixels are not changed, and the orientation is kept.
              </p>

              <div className="flex gap-3">
                <Button onClick={handleStrip} disabled={isStripping}>
                  {isStripping ? "Removing..." : "Remove all metadata"}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>

              <ProcessingStatus
                status={stripStatus}
                progress={stripProgress}
                errorMessage={stripError ?? undefined}
                onRetry={handleStrip}
              />

              {stripResult && (
                <DownloadButton
                  downloadUrl={stripResult.downloadUrl}
                  fileName={stripResult.outputMeta.fileName}
                  label="Download clean copy"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
