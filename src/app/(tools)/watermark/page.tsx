import { Metadata } from "next";
import { WatermarkForm } from "@/components/tools/watermark-form";

export const metadata: Metadata = { title: "Watermark" };

export default function WatermarkPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-heading font-bold">Watermark</h1>
        <p className="text-muted-foreground">Add text or image watermarks with customizable placement and opacity.</p>
      </div>
      <WatermarkForm />
    </div>
  );
}
