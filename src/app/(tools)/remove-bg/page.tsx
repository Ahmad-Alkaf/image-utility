import { ToolPage, toolMetadata } from "@/components/shared/tool-page";
import { RemoveBgForm } from "@/components/tools/remove-bg-form";

export const metadata = toolMetadata("remove-bg");

export default function Page() {
  return (
    <ToolPage id="remove-bg">
      <RemoveBgForm />
    </ToolPage>
  );
}
