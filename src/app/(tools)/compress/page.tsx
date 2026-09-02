import { ToolPage, toolMetadata } from "@/components/shared/tool-page";
import { CompressForm } from "@/components/tools/compress-form";

export const metadata = toolMetadata("compress");

export default function Page() {
  return (
    <ToolPage id="compress">
      <CompressForm />
    </ToolPage>
  );
}
