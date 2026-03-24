import Link from "next/link";
import {
  Image as ImageIcon,
  ArrowRightLeft,
  Eraser,
  FileDown,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: ArrowRightLeft,
    title: "Format Conversion",
    description: "Convert between PNG, JPEG, WebP, AVIF, and more",
  },
  {
    icon: Eraser,
    title: "Background Removal",
    description: "AI-powered background removal in seconds",
  },
  {
    icon: FileDown,
    title: "Smart Compression",
    description: "Reduce file size without losing quality",
  },
];

const stats = [
  { icon: Sparkles, label: "Free to use" },
  { icon: Shield, label: "Secure processing" },
  { icon: Zap, label: "Lightning fast" },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full">
      {/* Left branding panel */}
      <div className="relative hidden w-[480px] shrink-0 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 lg:flex lg:flex-col xl:w-[560px]">
        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Decorative gradient orbs */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-12">
          {/* Logo + tagline */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading text-2xl font-bold text-white">
                ImageForge
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-base leading-relaxed text-white/75">
              Professional image tools, completely free. Transform your images
              with powerful, easy-to-use tools.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-5">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom stats */}
          <div className="flex flex-wrap items-center gap-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 text-sm text-white/70"
              >
                <stat.icon className="h-4 w-4" />
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        {/* Mobile logo (hidden on lg+) */}
        <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-bold">ImageForge</span>
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
