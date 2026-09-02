import { createProcessHandler } from "@/lib/process-route";
import { filtersSchema } from "@/lib/validation";
import { applyFilters } from "@/lib/processing/filters";
import { outputFileName } from "@/lib/processing/format";
import { ProcessingType } from "@/generated/prisma";

export const POST = createProcessHandler({
  tool: "filters",
  type: ProcessingType.FILTERS,
  schema: filtersSchema,
  requiresAuth: true,
  run: async ({ file, inputBuffer, options }) => {
    const { buffer, info } = await applyFilters(inputBuffer, options);
    return {
      buffer,
      format: info.format,
      width: info.width,
      height: info.height,
      fileName: outputFileName(file.name, "-filtered", info.format),
    };
  },
});
