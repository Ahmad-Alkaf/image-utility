import type { Metadata } from "next";
import {
  FILE_RETENTION_HOURS,
  GITHUB_PROFILE_URL,
  GITHUB_REPOSITORY_URL,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "About ImageForge",
  description: "Meet the developer of ImageForge and inspect the public source code for its image tools.",
  alternates: { canonical: "/about" },
};

const linkClass = "text-primary underline underline-offset-4";

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="font-heading text-4xl font-bold">About ImageForge</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        ImageForge brings everyday image tools together: convert, compress, resize,
        crop, watermark, adjust colors, remove backgrounds, and inspect metadata.
      </p>

      <section className="mt-10 space-y-4" aria-labelledby="developer-heading">
        <h2 id="developer-heading" className="font-heading text-2xl font-bold">The developer and source code</h2>
        <p className="leading-relaxed text-muted-foreground">
          Built and maintained by <a href={GITHUB_PROFILE_URL} className={linkClass}>Ahmad Alkaf</a>
          {" "}as a <a href="https://kaflabs.com" className={linkClass}>KafLabs</a> product.
          The source code is public. You can inspect how the tools process images
          and handle temporary files.
        </p>
        <a href={GITHUB_REPOSITORY_URL} className={`inline-flex min-h-11 items-center ${linkClass}`}>
          View source on GitHub
        </a>
      </section>

      <section className="mt-10 space-y-4" aria-labelledby="files-heading">
        <h2 id="files-heading" className="font-heading text-2xl font-bold">How files are processed</h2>
        <p className="leading-relaxed text-muted-foreground">
          Most tools upload images to the ImageForge server for processing.
          Uploads and results are kept for {FILE_RETENTION_HOURS} hours, then removed
          by the scheduled cleanup. Background removal runs in your browser and
          does not upload the selected image.
        </p>
      </section>

      <section className="mt-10 space-y-4" aria-labelledby="support-heading">
        <h2 id="support-heading" className="font-heading text-2xl font-bold">Support</h2>
        <p className="leading-relaxed text-muted-foreground">
          For help or a problem report, email <a href="mailto:support@kaflabs.com" className={linkClass}>support@kaflabs.com</a>.
        </p>
      </section>
    </article>
  );
}
