"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sun,
  Moon,
  Menu,
  Image as ImageIcon,
  ArrowRightLeft,
  Eraser,
  Maximize2,
  FileDown,
  Stamp,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { useState } from "react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-bold">ImageForge</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
                Tools
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {toolLinks.map((tool) => (
                  <DropdownMenuItem key={tool.href} render={<Link href={tool.href} />}>
                    <tool.icon className="h-4 w-4" />
                    {tool.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isSignedIn && (
              <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
                Dashboard
              </Button>
            )}
          </nav>
        </div>

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
            <SignInButton mode="modal">
              <Button size="sm">Sign In</Button>
            </SignInButton>
          ) : (
            <UserButton />
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {toolLinks.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                <tool.icon className="h-4 w-4" />
                {tool.label}
              </Link>
            ))}
            {isSignedIn && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent border-t mt-2 pt-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
