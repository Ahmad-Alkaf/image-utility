import {
  ArrowRightLeft,
  Eraser,
  Maximize2,
  FileDown,
  Stamp,
  SlidersHorizontal,
  Info,
  Image as ImageIcon,
} from "lucide-react";

export type ToolIcon = React.ComponentType<{ className?: string }>;

/** Maps the `icon` name in the TOOLS registry to a lucide component. */
export const TOOL_ICONS: Record<string, ToolIcon> = {
  ArrowRightLeft,
  Eraser,
  Maximize2,
  FileDown,
  Stamp,
  SlidersHorizontal,
  Info,
  Image: ImageIcon,
};

/** Icon for a ProcessingType enum value (dashboard rows). */
export const JOB_TYPE_ICONS: Record<string, ToolIcon> = {
  CONVERT: ArrowRightLeft,
  REMOVE_BG: Eraser,
  RESIZE: Maximize2,
  COMPRESS: FileDown,
  WATERMARK: Stamp,
  FILTERS: SlidersHorizontal,
  METADATA_STRIP: Info,
};

export const FALLBACK_TOOL_ICON: ToolIcon = ImageIcon;
