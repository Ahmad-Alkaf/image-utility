import { ToolPage, toolMetadata } from "@/components/shared/tool-page";
import { FiltersForm } from "@/components/tools/filters-form";

export const metadata = toolMetadata("filters");

export default function Page() {
  return (
    <ToolPage id="filters">
      <FiltersForm />
    </ToolPage>
  );
}
