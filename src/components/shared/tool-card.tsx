import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ToolDefinition } from "@/types";
import { TOOL_ICONS, FALLBACK_TOOL_ICON } from "@/components/shared/tool-icons";

interface ToolCardProps {
  tool: ToolDefinition;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = TOOL_ICONS[tool.icon] ?? FALLBACK_TOOL_ICON;

  return (
    <Link href={tool.href} className="group block h-full" aria-label={tool.title}>
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-md border p-2.5">
              <Icon className="h-5 w-5 text-foreground/70" />
            </div>
            <div className="flex gap-1.5">
              {tool.supportsBatch && (
                <Badge variant="secondary" className="text-xs font-normal">
                  Batch
                </Badge>
              )}
              {tool.requiresAuth && (
                <Badge variant="outline" className="text-xs font-normal">
                  Account
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading font-semibold transition-colors group-hover:text-primary">
              {tool.name}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tool.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
