import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthLayout } from "@/components/shared/auth-layout";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn />
    </AuthLayout>
  );
}
