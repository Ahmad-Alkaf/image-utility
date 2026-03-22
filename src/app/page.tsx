import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/shared/tool-card";
import { TOOLS } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  Upload,
  MousePointerClick,
  Download,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

async function getProcessedCount(): Promise<number> {
  try {
    return await db.processingJob.count({
      where: { status: "COMPLETED" },
    });
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const processedCount = await getProcessedCount();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              Free &amp; Open Source
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Transform Your Images{" "}
              <span className="text-primary">in Seconds</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Convert, compress, resize, remove backgrounds, add watermarks, and
              more. All from a single, powerful dashboard — no software to
              install.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="text-base px-8" render={<Link href="/convert" />}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" render={<Link href="/sign-up" />}>
                Create Free Account
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </section>

      {/* Tool Grid */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-3 mb-12">
          <h2 className="font-heading text-3xl font-bold">
            Powerful Image Tools
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to edit and optimize your images, all in one
            place.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-3 mb-12">
            <h2 className="font-heading text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground">
              Three simple steps to transform your images.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Upload,
                step: "1",
                title: "Upload",
                description:
                  "Drag and drop your image or click to browse. Supports all major formats up to 50MB.",
              },
              {
                icon: MousePointerClick,
                step: "2",
                title: "Choose Tool",
                description:
                  "Select from our suite of tools — convert, compress, resize, remove backgrounds, and more.",
              },
              {
                icon: Download,
                step: "3",
                title: "Download",
                description:
                  "Preview the result and download your processed image instantly. It's that simple.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-4 relative">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              value:
                processedCount > 0
                  ? `${processedCount.toLocaleString()}+ images processed`
                  : "Instant processing",
              description:
                "Server-side processing with Sharp delivers results in milliseconds.",
            },
            {
              icon: Shield,
              title: "Privacy First",
              value: "Files auto-deleted",
              description:
                "Your images are automatically deleted after 24 hours. We never share your data.",
            },
            {
              icon: Clock,
              title: "Always Free",
              value: "No hidden costs",
              description:
                "Core tools are free forever. Sign in to unlock advanced features.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="text-center space-y-3 p-6 rounded-xl border bg-card"
            >
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{item.value}</p>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5">
        <div className="container mx-auto px-4 py-16 text-center space-y-6">
          <h2 className="font-heading text-3xl font-bold">
            Ready to Transform Your Images?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            No sign-up required for basic tools. Create a free account for
            advanced features.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" render={<Link href="/convert" />}>
              Start Converting
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/sign-up" />}>
              Create Free Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
