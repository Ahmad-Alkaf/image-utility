import { ToolPage, toolMetadata } from "@/components/shared/tool-page";
import { ConvertForm } from "@/components/tools/convert-form";

export const metadata = toolMetadata("convert");

export default function Page() {
  return (
    <ToolPage id="convert">
      <ConvertForm />
    </ToolPage>
  );
}
