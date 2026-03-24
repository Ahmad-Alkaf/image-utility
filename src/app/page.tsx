import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/shared/tool-card";
import { TOOLS } from "@/lib/constants";
import { Shield, Clock, HardDrive, Zap, ArrowRight } from "lucide-react";

const FORMATS = ["PNG", "JPEG", "WebP", "AVIF", "TIFF", "GIF", "BMP", "ICO"];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b">
        {/* dot grid */}
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] [background-size:24px_24px] opacity-40" />
        {/* warm gradient wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-accent/8" />

        <div className="container relative mx-auto px-4 py-16 text-center md:py-24 lg:py-28">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* chip */}
            <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Zap className="h-3 w-3 text-primary" />
              No uploads to third parties — processed on our servers
            </div>

            <h1 className="animate-fade-in-up font-heading text-4xl font-extrabold tracking-tight [animation-delay:80ms] sm:text-5xl lg:text-6xl">
              Your image{" "}
              <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-4 bg-clip-text text-transparent">
                workshop.
              </span>
            </h1>

            <p className="animate-fade-in-up mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground [animation-delay:160ms]">
              Convert, compress, resize, remove backgrounds, and more — fast,
              private, and hassle-free. No credit card, no sign-ups for basic
              tools.
            </p>

            <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-3 pt-1 [animation-delay:240ms]">
              <Button size="lg" render={<Link href="/convert" />}>
                Start converting
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/sign-up" />}
              >
                Create free account
              </Button>
            </div>

            {/* format pills */}
            <div className="animate-fade-in-up flex flex-wrap justify-center gap-1.5 pt-1 [animation-delay:320ms]">
              {FORMATS.map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tool Grid ── */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-8 space-y-1">
          <h2 className="font-heading text-2xl font-bold">Tools</h2>
          <p className="text-sm text-muted-foreground">
            Pick a tool to get started. Some require a free account.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TOOLS.map((tool, i) => (
            <div
              key={tool.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${(i + 1) * 60}ms` }}
            >
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Info Strip ── */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Private & secure</p>
                <p className="text-muted-foreground">
                  Files auto-deleted after 24 h
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Instant processing
                </p>
                <p className="text-muted-foreground">Server-side with Sharp</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Large files welcome
                </p>
                <p className="text-muted-foreground">Up to 50 MB per file</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
