/**
 * ImageForge logo — renders public/logo.svg using CSS mask
 * so it inherits `currentColor` from the parent.
 *
 * Brand colors (apply via CSS `color`):
 *   Primary terracotta:  oklch(0.52 0.12 38) / #B05C3B
 */
export function Logo({
  className,
  wordmark,
}: {
  className?: string;
  wordmark?: boolean;
}) {
  if (wordmark) {
    return (
      <span
        className={className}
        role="img"
        aria-label="ImageForge"
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <span
          style={{
            display: "inline-block",
            width: "1.5em",
            height: "1.5em",
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
        <span style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          ImageForge
        </span>
      </span>
    );
  }

  return (
    <span
      className={className}
      role="img"
      aria-label="ImageForge"
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
  );
}
