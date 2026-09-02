import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { getTool, SITE_NAME, type ToolId } from "@/lib/constants";

/** Page metadata for a tool page, derived from the TOOLS registry. */
export function toolMetadata(id: ToolId): Metadata {
  const tool = getTool(id);
  return {
    title: tool.title,
    description: tool.seoDescription,
    alternates: { canonical: tool.href },
    openGraph: {
      title: `${tool.title} | ${SITE_NAME}`,
      description: tool.seoDescription,
      url: tool.href,
    },
  };
}

/** Shared frame for every tool page: title, description, and the form. */
export function ToolPage({ id, children }: { id: ToolId; children: React.ReactNode }) {
  const tool = getTool(id);
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 space-y-1.5">
        <h1 className="font-heading text-2xl font-bold">{tool.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{tool.description}</p>
        {tool.requiresAuth && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Free account required
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
