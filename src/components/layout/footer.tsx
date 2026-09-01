import Link from "next/link";
import { Logo } from "@/components/logo";

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
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto px-4 py-10 lg:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1.2fr_1fr]">
          {/* Brand column */}
          <div>
            <Link href="/">
              <Logo size="lg" />
            </Link>
            <p className="mt-3 max-w-65 text-sm leading-relaxed text-muted-foreground">
              Fast, private image tools. Convert, compress, resize, and
              more — all in one place.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              A{" "}
              <a
                href="https://kaflabs.com"
                target="_blank"
                rel="noopener"
                className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground"
              >
                KafLabs
              </a>{" "}
              product
            </p>
          </div>

          {/* Tools column */}
          <div>
            <h4 className="font-heading text-sm font-semibold">Tools</h4>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
              {toolLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center gap-2 border-t pt-5 sm:flex-row sm:justify-between">
          <span className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <a
              href="https://kaflabs.com"
              target="_blank"
              rel="noopener"
              className="transition-colors hover:text-foreground"
            >
              KafLabs
            </a>
            . All rights reserved.
          </span>
          <div className="flex gap-4">
            <a
              href="https://kaflabs.com/privacy.html"
              target="_blank"
              rel="noopener"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </a>
            <a
              href="https://kaflabs.com/terms.html"
              target="_blank"
              rel="noopener"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
