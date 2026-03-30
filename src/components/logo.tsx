import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

const sizeConfig = {
  sm: { icon: "text-lg", text: "text-sm", gap: "gap-1.5" },
  md: { icon: "text-[1.6rem]", text: "text-lg", gap: "gap-2" },
  lg: { icon: "text-[1.75rem]", text: "text-xl", gap: "gap-2.5" },
} as const;

/**
 * ImageForge logo — renders public/logo.svg via CSS mask + optional wordmark.
 *
 * - `size`    — sm | md (default) | lg
 * - `mono`    — when true, inherits color from parent (e.g. white in auth panel)
 * - `showText`— hides the wordmark when false
 */
export function Logo({
  className,
  size = "md",
  showText = true,
  mono = false,
}: {
  className?: string;
  size?: LogoSize;
  showText?: boolean;
  mono?: boolean;
}) {
  const config = sizeConfig[size];

  return (
    <span
      className={cn("inline-flex items-center", config.gap, className)}
      role="img"
      aria-label="ImageForge"
    >
      <span
        className={cn("shrink-0", config.icon, !mono && "text-primary")}
        style={{
          display: "inline-block",
          width: "1em",
          height: "1em",
          backgroundColor: "currentColor",
          maskImage: "url(/logo.svg)",
          WebkitMaskImage: "url(/logo.svg)",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      />
      {showText && (
        <span className={cn("font-display font-semibold", config.text)} style={{ letterSpacing: "0.05em" }}>
          <span className={cn(mono && "opacity-70")}>Image</span><span className={cn(!mono && "text-primary")}>Forge</span>
        </span>
      )}
    </span>
  );
}
