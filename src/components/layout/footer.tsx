import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const toolLinks = [
  { href: "/convert", label: "Format Conversion" },
  { href: "/remove-bg", label: "Background Removal" },
  { href: "/resize", label: "Resize & Crop" },
  { href: "/compress", label: "Compression" },
  { href: "/watermark", label: "Watermark" },
  { href: "/filters", label: "Filters" },
  { href: "/metadata", label: "Metadata" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <span className="font-heading text-lg font-bold">
                ImageForge
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Free online image tools for everyone. Convert, compress, resize,
              and transform your images with ease.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Tools</h4>
            <nav className="flex flex-col gap-2">
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Account</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/sign-in"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Info</h4>
            <nav className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">
                All processing is done on our servers
              </span>
              <span className="text-sm text-muted-foreground">
                Files are deleted after 24 hours
              </span>
              <span className="text-sm text-muted-foreground">
                Max file size: 50MB
              </span>
            </nav>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ImageForge. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Sharp, and Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}
