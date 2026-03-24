import { Metadata } from "next";
import { RemoveBgForm } from "@/components/tools/remove-bg-form";

export const metadata: Metadata = { title: "Background Removal" };

export default function RemoveBgPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-heading font-bold">Background Removal</h1>
        <p className="text-sm text-muted-foreground">Remove image backgrounds automatically with AI-powered detection.</p>
      </div>
      <RemoveBgForm />
    </div>
  );
}
