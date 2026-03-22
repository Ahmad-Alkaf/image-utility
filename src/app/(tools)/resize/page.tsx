import { Metadata } from "next";
import { ResizeForm } from "@/components/tools/resize-form";

export const metadata: Metadata = { title: "Resize & Crop" };

export default function ResizePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-heading font-bold">Resize & Crop</h1>
        <p className="text-muted-foreground">Resize images to exact dimensions or crop with preset aspect ratios.</p>
      </div>
      <ResizeForm />
    </div>
  );
}
