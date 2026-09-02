"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPLOAD_LIMITS } from "@/lib/constants";

interface SignInGateProps {
  children: React.ReactNode;
  /** Lower-case tool name used in the sentence, e.g. "watermark". */
  toolName: string;
}

export function SignInGate({ children, toolName }: SignInGateProps) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-lg border bg-card p-10 text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-heading text-lg font-semibold">
              Sign in to continue
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              The <span className="font-medium text-foreground">{toolName}</span>{" "}
              tool needs a free account. Members also get files up to{" "}
              {UPLOAD_LIMITS.authenticated.maxFileSize / (1024 * 1024)} MB and a
              history of their results.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/sign-up" />}>
              Create account
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Free. No credit card needed.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
