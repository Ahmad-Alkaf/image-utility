import { Metadata } from "next";
import { ConvertForm } from "@/components/tools/convert-form";

export const metadata: Metadata = { title: "Format Conversion" };

export default function ConvertPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-heading font-bold">Format Conversion</h1>
        <p className="text-muted-foreground">Convert images between PNG, JPEG, WebP, AVIF, TIFF, and more formats.</p>
      </div>
      <ConvertForm />
    </div>
  );
}
