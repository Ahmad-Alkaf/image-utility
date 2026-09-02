"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Sun, Moon, Menu, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/logo";
import { TOOLS } from "@/lib/constants";
import { TOOL_ICONS } from "@/components/shared/tool-icons";

const toolLinks = TOOLS.map((tool) => ({
  href: tool.href,
  label: tool.shortLabel,
  icon: TOOL_ICONS[tool.icon],
}));

export function Header() {
  const { theme, setTheme } = useTheme();
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label="ImageForge home">
          <Logo />
        </Link>

        {/* Large screens: labels */}
        <nav className="hidden xl:flex items-center gap-1" aria-label="Tools">
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
              <LayoutDashboard className="h-4 w-4" />
              History
            </Button>
          )}
        </nav>

        {/* Medium screens: icons with tooltips */}
        <TooltipProvider>
          <nav className="hidden md:flex xl:hidden items-center gap-0.5" aria-label="Tools">
            {toolLinks.map((tool) => (
              <Tooltip key={tool.href}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={tool.label}
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
                      aria-label="History"
                      render={<Link href="/dashboard" />}
                    />
                  }
                >
                  <LayoutDashboard className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">History</TooltipContent>
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
            aria-label="Toggle dark mode"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {!isLoaded ? (
            <div className="h-8 w-8 rounded-full bg-muted" aria-hidden />
          ) : !isSignedIn ? (
            <Button size="sm" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
          ) : (
            <UserButton />
          )}

          {/* Small screens: dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" aria-label="Open menu" />
              }
            >
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {toolLinks.map((tool) => (
                <DropdownMenuItem key={tool.href} render={<Link href={tool.href} />}>
                  <tool.icon className="h-4 w-4" />
                  {tool.label}
                </DropdownMenuItem>
              ))}
              {isSignedIn && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/dashboard" />}>
                    <LayoutDashboard className="h-4 w-4" />
                    History
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
