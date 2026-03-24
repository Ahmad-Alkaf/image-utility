import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { ToolDefinition } from "@/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ArrowRightLeft,
  Eraser,
  Maximize2,
  FileDown,
  Stamp,
  SlidersHorizontal,
  Info,
  Image: ImageIcon,
};

interface ToolCardProps {
  tool: ToolDefinition;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = ICON_MAP[tool.icon] ?? ImageIcon;

  return (
    <Link href={tool.href} className="group">
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="rounded-md border p-2.5">
              <Icon className="h-5 w-5 text-foreground/70" />
            </div>
            {tool.requiresAuth && (
              <Badge variant="outline" className="text-xs font-normal">
                Account
              </Badge>
            )}
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading font-semibold group-hover:text-primary transition-colors">
              {tool.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tool.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
