import { ToolPage, toolMetadata } from "@/components/shared/tool-page";
import { MetadataViewer } from "@/components/tools/metadata-viewer";

export const metadata = toolMetadata("metadata");

export default function Page() {
  return (
    <ToolPage id="metadata">
      <MetadataViewer />
    </ToolPage>
  );
}
