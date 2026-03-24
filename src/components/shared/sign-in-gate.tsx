"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Lock } from "lucide-react";
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
              The{" "}
              <span className="font-medium text-foreground">{toolName}</span>{" "}
              tool requires a free account.
            </p>
          </div>

          <Button size="lg" render={<Link href="/sign-in" />}>
            Sign in
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
