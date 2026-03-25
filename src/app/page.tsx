import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/shared/tool-card";
import { TOOLS } from "@/lib/constants";
import { getStats, areStatsWorthShowing } from "@/lib/stats";
import { Shield, Clock, HardDrive, Zap, ArrowRight, Images, Users, TrendingDown } from "lucide-react";

const FORMATS = ["PNG", "JPEG", "WebP", "AVIF", "TIFF", "GIF", "SVG"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function StatsCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center">
      <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
      <div className="h-7 w-16 rounded bg-muted animate-pulse" />
      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
    </div>
  );
}

function StatsFallback() {
  return (
    <section className="border-b bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      </div>
    </section>
  );
}

async function StatsSection() {
  let stats;
  try {
    stats = await getStats();
  } catch {
    return null;
  }

  if (!areStatsWorthShowing(stats)) return null;

  return (
    <section className="border-b bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Images className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{formatCount(stats.totalFilesProcessed)}</p>
            <p className="text-xs text-muted-foreground">Images processed</p>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HardDrive className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{formatBytes(stats.totalDataProcessedBytes)}</p>
            <p className="text-xs text-muted-foreground">Data processed</p>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <TrendingDown className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{formatBytes(stats.totalSpaceSavedBytes)}</p>
            <p className="text-xs text-muted-foreground">Space saved</p>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{formatCount(stats.totalUsers)}</p>
            <p className="text-xs text-muted-foreground">Users</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b">
        {/* dot grid */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] bg-size-[24px_24px] opacity-40" />
        {/* warm gradient wash */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/6 via-transparent to-accent/8" />

        <div className="container relative mx-auto px-4 py-16 text-center md:py-24 lg:py-28">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* chip */}
            <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Zap className="h-3 w-3 text-primary" />
              No uploads to third parties — processed on our servers
            </div>

            <h1 className="animate-fade-in-up font-heading text-4xl font-extrabold tracking-tight [animation-delay:80ms] sm:text-5xl lg:text-6xl">
              Your image{" "}
              <span className="bg-linear-to-r from-primary via-chart-1 to-chart-4 bg-clip-text text-transparent">
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

      {/* ── Stats Section (streamed independently) ── */}
      <Suspense fallback={<StatsFallback />}>
        <StatsSection />
      </Suspense>

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
                <p className="text-muted-foreground">Up to 50 MB per file for members</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
