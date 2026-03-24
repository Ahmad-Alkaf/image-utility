import Link from "next/link";

const toolLinks = [
  { href: "/convert", label: "Convert" },
  { href: "/remove-bg", label: "Remove BG" },
  { href: "/resize", label: "Resize" },
  { href: "/compress", label: "Compress" },
  { href: "/watermark", label: "Watermark" },
  { href: "/filters", label: "Filters" },
  { href: "/metadata", label: "Metadata" },
];

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-5 sm:flex-row sm:justify-between">
        <span className="font-heading text-sm font-semibold">ImageForge</span>

        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {toolLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}
