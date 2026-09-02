import Link from "next/link";
import { ArrowLeft, Zap, Shield, Sparkles, Clock } from "lucide-react";
import { Logo } from "@/components/logo";
import { FILE_RETENTION_HOURS, UPLOAD_LIMITS } from "@/lib/constants";

const features = [
  { icon: Sparkles, label: "Free, no credit card" },
  {
    icon: Zap,
    label: `Files up to ${UPLOAD_LIMITS.authenticated.maxFileSize / (1024 * 1024)} MB and batches of ${UPLOAD_LIMITS.authenticated.maxFiles}`,
  },
  { icon: Shield, label: "Watermark, filters, and background removal" },
  { icon: Clock, label: `History of your results for ${FILE_RETENTION_HOURS} hours` },
] as const;

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-100 flex bg-background">
      {/* Left branding panel */}
      <div className="relative hidden w-120 shrink-0 overflow-hidden lg:block xl:w-135">
        <div className="absolute inset-0 bg-linear-to-br from-[oklch(0.30_0.06_35)] via-[oklch(0.24_0.05_30)] to-[oklch(0.18_0.04_25)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-[oklch(0.52_0.12_38)] opacity-15 blur-[100px]" />
        <div className="absolute -left-16 bottom-1/4 h-64 w-64 rounded-full bg-[oklch(0.45_0.10_60)] opacity-10 blur-[80px]" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link
            href="/"
            className="text-white/90 transition-opacity hover:opacity-80"
            aria-label="ImageForge home"
          >
            <Logo size="lg" mono />
          </Link>

          <div className="space-y-10">
            <div className="space-y-4">
              <h1 className="font-heading text-[2.75rem] font-extrabold leading-[1.05] tracking-tight text-white">
                Image tools
                <br />
                that just work.
              </h1>
              <p className="max-w-70 text-[15px] leading-relaxed text-white/50">
                A free account unlocks the full toolbox and bigger uploads.
              </p>
            </div>

            <ul className="space-y-3.5">
              {features.map((f) => (
                <li key={f.label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/8">
                    <f.icon className="h-4 w-4 text-white/60" />
                  </div>
                  <span className="text-sm text-white/60">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/30">
            Convert, compress, resize, watermark, and more.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-5 lg:hidden">
          <Link href="/" className="text-foreground" aria-label="ImageForge home">
            <Logo mono />
          </Link>
        </div>

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
