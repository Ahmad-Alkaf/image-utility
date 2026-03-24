"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
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
      <div className="flex flex-col items-center justify-center gap-5 rounded-lg border border-dashed p-14 text-center">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-medium">Sign in to continue</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Create a free account or sign in to use the {toolName} tool.
          </p>
        </div>
        <SignInButton mode="modal">
          <Button size="lg">Sign in</Button>
        </SignInButton>
      </div>
    );
  }

  return children;
}
