"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignInGateProps {
  children: React.ReactNode;
  toolName: string;
}

export function SignInGate({ children, toolName }: SignInGateProps) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-card to-muted/30 p-12 text-center">
        {/* Decorative background elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Icon with layered styling */}
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-md" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
              <Lock className="h-7 w-7 text-primary" />
            </div>
          </div>

          {/* Copy */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">
              Sign in to continue
            </h3>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              Create a free account or sign in to use the{" "}
              <span className="font-medium text-foreground">{toolName}</span>{" "}
              tool and unlock your full image editing workflow.
            </p>
          </div>

          {/* CTA */}
          <Button size="lg" className="gap-2 px-8" render={<Link href="/sign-in" />}>
            <Sparkles className="h-4 w-4" />
            Get started free
          </Button>

          <p className="text-xs text-muted-foreground">
            No credit card required
          </p>
        </div>
      </div>
    );
  }

  return children;
}
