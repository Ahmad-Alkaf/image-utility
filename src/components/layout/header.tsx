"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Sun,
  Moon,
  Menu,
  ArrowRightLeft,
  Eraser,
  Maximize2,
  FileDown,
  Stamp,
  SlidersHorizontal,
  Info,
  LayoutDashboard,
} from "lucide-react";
import { Logo } from "@/components/logo";


const toolLinks = [
  { href: "/convert", label: "Convert", icon: ArrowRightLeft },
  { href: "/remove-bg", label: "Remove BG", icon: Eraser },
  { href: "/resize", label: "Resize", icon: Maximize2 },
  { href: "/compress", label: "Compress", icon: FileDown },
  { href: "/watermark", label: "Watermark", icon: Stamp },
  { href: "/filters", label: "Filters", icon: SlidersHorizontal },
  { href: "/metadata", label: "Metadata", icon: Info },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <Logo />
        </Link>

        {/* Center: nav links (large screens with labels, medium screens icons only) */}
        <nav className="hidden xl:flex items-center gap-1">
          {toolLinks.map((tool) => (
            <Button
              key={tool.href}
              variant="ghost"
              size="sm"
              render={<Link href={tool.href} />}
            >
              <tool.icon className="h-4 w-4" />
              {tool.label}
            </Button>
          ))}
          {isSignedIn && (
            <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
          )}
        </nav>

        <TooltipProvider>
          <nav className="hidden md:flex xl:hidden items-center gap-0.5">
            {toolLinks.map((tool) => (
              <Tooltip key={tool.href}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link href={tool.href} />}
                    />
                  }
                >
                  <tool.icon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{tool.label}</TooltipContent>
              </Tooltip>
            ))}
            {isSignedIn && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link href="/dashboard" />}
                    />
                  }
                >
                  <LayoutDashboard className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Dashboard</TooltipContent>
              </Tooltip>
            )}
          </nav>
        </TooltipProvider>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {!isSignedIn ? (
            <Button size="sm" render={<Link href="/sign-in" />}>
              Sign In
            </Button>
          ) : (
            <UserButton />
          )}

          {/* Small screens: dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" />
              }
            >
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {toolLinks.map((tool) => (
                <DropdownMenuItem key={tool.href} render={<Link href={tool.href} />}>
                  <tool.icon className="h-4 w-4" />
                  {tool.label}
                </DropdownMenuItem>
              ))}
              {isSignedIn && (
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  Dashboard
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
