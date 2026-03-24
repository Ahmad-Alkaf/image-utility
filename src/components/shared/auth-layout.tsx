import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full">
      {/* Left branding panel — clean, typographic */}
      <div className="relative hidden w-[480px] shrink-0 border-r bg-muted/40 lg:flex lg:flex-col xl:w-[520px]">
        <div className="flex flex-1 flex-col justify-between p-10 xl:p-12">
          {/* Logo */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <span className="font-heading text-xl font-bold">
                ImageForge
              </span>
            </Link>
          </div>

          {/* Central message */}
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-bold leading-tight">
              Image tools
              <br />
              that just work.
            </h2>
            <p className="text-muted-foreground max-w-xs leading-relaxed">
              Convert, compress, resize, remove backgrounds, and more.
              No installs required.
            </p>
          </div>

          {/* Bottom note */}
          <p className="text-xs text-muted-foreground">
            Free to use. Files auto-deleted after 24h.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <span className="font-heading text-lg font-bold">ImageForge</span>
          </Link>
        </div>

        {children}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link
            href="/"
            className="hover:text-foreground transition-colors underline underline-offset-4"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
