import { ToolPage, toolMetadata } from "@/components/shared/tool-page";
import { ResizeForm } from "@/components/tools/resize-form";

export const metadata = toolMetadata("resize");

export default function Page() {
  return (
    <ToolPage id="resize">
      <ResizeForm />
    </ToolPage>
  );
}
