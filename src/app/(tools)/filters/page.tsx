import { Metadata } from "next";
import { FiltersForm } from "@/components/tools/filters-form";

export const metadata: Metadata = { title: "Filters & Adjustments" };

export default function FiltersPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-heading font-bold">Filters & Adjustments</h1>
        <p className="text-sm text-muted-foreground">Apply filters, adjust brightness, contrast, saturation, and more.</p>
      </div>
      <FiltersForm />
    </div>
  );
}
