import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/shared/tool-card";
import {
  TOOLS,
  FORMAT_LABELS,
  SUPPORTED_FORMATS,
  UPLOAD_LIMITS,
  RATE_LIMITS,
  FILE_RETENTION_HOURS,
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
} from "@/lib/constants";
import { getStats, areStatsWorthShowing } from "@/lib/stats";
import { formatBytes, formatCount } from "@/lib/format";
import {
  Shield,
  Clock,
  HardDrive,
  Zap,
  ArrowRight,
  Images,
  Users,
  TrendingDown,
  Upload,
  Settings2,
  Download,
} from "lucide-react";

// Revalidate the prerendered home page so the stats section is refreshed
// instead of being frozen at build time (matches the 30 min stats cache).
export const revalidate = 1800;

const MB = 1024 * 1024;
const anonMb = UPLOAD_LIMITS.anonymous.maxFileSize / MB;
const memberMb = UPLOAD_LIMITS.authenticated.maxFileSize / MB;

const STEPS = [
  {
    icon: Upload,
    title: "Drop an image",
    text: "Drag a file onto the page or pick one from your device. Batch tools take several files at once.",
  },
  {
    icon: Settings2,
    title: "Set the options",
    text: "Pick the format, size, quality, or effect. The preview updates so you can check the result first.",
  },
  {
    icon: Download,
    title: "Download",
    text: "Get the file straight away. Batch results come as one ZIP. Signed-in users also find every result in their history.",
  },
];

const FAQ = [
  {
    q: `Is ${SITE_NAME} free?`,
    a: `Yes. Every tool is free. Without an account you can upload files up to ${anonMb} MB and run ${RATE_LIMITS.anonymous.maxRequests} jobs per hour. A free account raises that to ${memberMb} MB per file, ${UPLOAD_LIMITS.authenticated.maxFiles} files per batch, and ${RATE_LIMITS.authenticated.maxRequests} jobs per hour, and unlocks the watermark, filters, and background removal tools.`,
  },
  {
    q: "What happens to my files?",
    a: `Uploads and results stay on our server for ${FILE_RETENTION_HOURS} hours so you can download them, then they are deleted automatically. Each result has a private download link. Background removal runs entirely in your browser, so that image is never uploaded at all.`,
  },
  {
    q: "Which formats are supported?",
    a: `${SUPPORTED_FORMATS.map((f) => FORMAT_LABELS[f]).join(", ")}. SVG files can be converted into any of these, and the metadata viewer reads them too.`,
  },
  {
    q: "Do I need to install anything?",
    a: "No. Everything runs in your web browser on a phone, tablet, or computer.",
  },
  {
    q: "Does converting reduce the quality?",
    a: "Only when you choose a lossy format such as JPEG, WebP, or AVIF at a quality below 100. PNG and TIFF conversions are lossless.",
  },
];

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

  if (!areStatsWorthShowing(stats) && process.env.NODE_ENV !== "development") return null;

  const cards = [
    { icon: Images, value: formatCount(stats.totalFilesProcessed), label: "Images processed", tone: "" },
    { icon: HardDrive, value: formatBytes(stats.totalDataProcessedBytes), label: "Data processed", tone: "" },
    { icon: TrendingDown, value: formatBytes(stats.totalSpaceSavedBytes), label: "Space saved", tone: "green" },
    { icon: Users, value: formatCount(stats.totalUsers), label: "Members", tone: "" },
  ];

  return (
    <section className="border-b bg-muted/20" aria-label="Usage statistics">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center">
              <div
                className={
                  card.tone === "green"
                    ? "flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600"
                    : "flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
                }
              >
                <card.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: TOOLS.map((t) => t.title),
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] bg-size-[24px_24px] opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/6 via-transparent to-accent/8" />

        <div className="container relative mx-auto px-4 py-16 text-center md:py-24 lg:py-28">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Zap className="h-3 w-3 text-primary" />
              Free, no sign-up needed for most tools
            </div>

            <h1 className="animate-fade-in-up font-display text-5xl tracking-tight [animation-delay:80ms] sm:text-6xl lg:text-7xl">
              Your image{" "}
              <span className="bg-linear-to-r from-primary via-chart-1 to-chart-4 bg-clip-text italic text-transparent">
                workshop.
              </span>
            </h1>

            <p className="animate-fade-in-up mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground [animation-delay:160ms]">
              Convert, compress, resize, watermark, and clean up images in your
              browser. Nothing to install, and your files are deleted after{" "}
              {FILE_RETENTION_HOURS} hours.
            </p>

            <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-3 pt-1 [animation-delay:240ms]">
              <Button size="lg" render={<Link href="/convert" />}>
                Convert an image
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/sign-up" />}
              >
                Create a free account
              </Button>
            </div>

            <div className="animate-fade-in-up flex flex-wrap justify-center gap-1.5 pt-1 [animation-delay:320ms]">
              {SUPPORTED_FORMATS.map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {FORMAT_LABELS[fmt]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats (streamed independently) */}
      <Suspense fallback={<StatsFallback />}>
        <StatsSection />
      </Suspense>

      {/* Tool grid */}
      <section className="container mx-auto px-4 py-12 md:py-16" aria-labelledby="tools-heading">
        <div className="mb-8 space-y-1">
          <h2 id="tools-heading" className="font-heading text-2xl font-bold">
            Tools
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a tool to start. Tools marked &ldquo;Account&rdquo; need a free
            account.
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

      {/* How it works */}
      <section className="border-t bg-muted/20" aria-labelledby="how-heading">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mb-8 space-y-1">
            <h2 id="how-heading" className="font-heading text-2xl font-bold">
              How it works
            </h2>
            <p className="text-sm text-muted-foreground">Three steps, no learning curve.</p>
          </div>
          <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-card text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">
                    <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Info strip */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Private by default</p>
                <p className="text-muted-foreground">
                  Files are deleted after {FILE_RETENTION_HOURS} hours
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Fast</p>
                <p className="text-muted-foreground">Most jobs finish in a few seconds</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Large files welcome</p>
                <p className="text-muted-foreground">
                  Up to {anonMb} MB per file, or {memberMb} MB with a free account
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/20" aria-labelledby="faq-heading">
        <div className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 id="faq-heading" className="mb-6 font-heading text-2xl font-bold">
            Questions and answers
          </h2>
          <dl className="divide-y rounded-xl border bg-card">
            {FAQ.map((item) => (
              <div key={item.q} className="space-y-1.5 p-5">
                <dt className="font-medium">{item.q}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
