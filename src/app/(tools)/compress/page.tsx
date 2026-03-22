import { Metadata } from "next";
import { CompressForm } from "@/components/tools/compress-form";

export const metadata: Metadata = { title: "Image Compression" };

export default function CompressPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-heading font-bold">Image Compression</h1>
        <p className="text-muted-foreground">Reduce file size while maintaining quality with smart compression.</p>
      </div>
      <CompressForm />
    </div>
  );
}
