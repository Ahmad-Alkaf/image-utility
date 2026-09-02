import { ToolPage, toolMetadata } from "@/components/shared/tool-page";
import { WatermarkForm } from "@/components/tools/watermark-form";

export const metadata = toolMetadata("watermark");

export default function Page() {
  return (
    <ToolPage id="watermark">
      <WatermarkForm />
    </ToolPage>
  );
}
