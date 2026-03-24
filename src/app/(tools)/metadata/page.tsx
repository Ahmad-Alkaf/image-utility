import { Metadata } from "next";
import { MetadataViewer } from "@/components/tools/metadata-viewer";

export const metadata: Metadata = { title: "Metadata Viewer" };

export default function MetadataPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-heading font-bold">Metadata Viewer</h1>
        <p className="text-sm text-muted-foreground">View EXIF data, GPS coordinates, camera info and strip metadata for privacy.</p>
      </div>
      <MetadataViewer />
    </div>
  );
}
