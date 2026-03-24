import Link from "next/link";
import {
  Image as ImageIcon,
  ArrowLeft,
  Zap,
  Shield,
  Sparkles,
  Clock,
} from "lucide-react";

const features = [
  { icon: Zap, label: "Instant processing" },
  { icon: Shield, label: "Privacy-first design" },
  { icon: Clock, label: "Files auto-deleted after 24h" },
  { icon: Sparkles, label: "Completely free to use" },
] as const;

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex bg-background">
      {/* Left branding panel — warm gradient with depth */}
      <div className="relative hidden w-[480px] shrink-0 overflow-hidden lg:block xl:w-[540px]">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.30_0.06_35)] via-[oklch(0.24_0.05_30)] to-[oklch(0.18_0.04_25)]" />

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Ambient glow accents */}
        <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-[oklch(0.52_0.12_38)] opacity-15 blur-[100px]" />
        <div className="absolute -left-16 bottom-1/4 h-64 w-64 rounded-full bg-[oklch(0.45_0.10_60)] opacity-10 blur-[80px]" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-white/90 transition-opacity hover:opacity-80"
          >
            <ImageIcon className="h-5 w-5" />
            <span className="font-heading text-lg font-bold tracking-tight">
              ImageForge
            </span>
          </Link>

          <div className="space-y-10">
            <div className="space-y-4">
              <h1 className="font-heading text-[2.75rem] font-extrabold leading-[1.05] tracking-tight text-white">
                Image tools
                <br />
                that just work.
              </h1>
              <p className="max-w-[280px] text-[15px] leading-relaxed text-white/50">
                Professional-grade image processing. No downloads, no signup
                walls — just results.
              </p>
            </div>

            <div className="space-y-3.5">
              {features.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/[0.08]">
                    <f.icon className="h-4 w-4 text-white/60" />
                  </div>
                  <span className="text-sm text-white/60">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/30">
            Convert, compress, resize, remove backgrounds, and more.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Mobile logo */}
        <div className="px-6 pt-5 lg:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground"
          >
            <ImageIcon className="h-5 w-5 text-primary" />
            <span className="font-heading text-base font-bold">
              ImageForge
            </span>
          </Link>
        </div>

        {/* Form */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-8">
          <div className="animate-fade-in-up space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
