"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Eraser,
  Maximize2,
  FileDown,
  Stamp,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  { href: "/convert", label: "Convert", icon: ArrowRightLeft },
  { href: "/remove-bg", label: "Remove BG", icon: Eraser },
  { href: "/resize", label: "Resize", icon: Maximize2 },
  { href: "/compress", label: "Compress", icon: FileDown },
  { href: "/watermark", label: "Watermark", icon: Stamp },
  { href: "/filters", label: "Filters", icon: SlidersHorizontal },
  { href: "/metadata", label: "Metadata", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-4">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
