import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
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
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/15 transition-colors">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {tool.requiresAuth && (
              <Badge variant="secondary" className="text-xs">
                Sign in required
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {tool.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tool.description}
            </p>
          </div>
          <div className="flex items-center text-sm font-medium text-primary mt-auto">
            Try it now
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
