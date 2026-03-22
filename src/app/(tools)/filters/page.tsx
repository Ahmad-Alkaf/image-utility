import { Metadata } from "next";
import { FiltersForm } from "@/components/tools/filters-form";

export const metadata: Metadata = { title: "Filters & Adjustments" };

export default function FiltersPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-heading font-bold">Filters & Adjustments</h1>
        <p className="text-muted-foreground">Apply filters, adjust brightness, contrast, saturation, and more.</p>
      </div>
      <FiltersForm />
    </div>
  );
}
