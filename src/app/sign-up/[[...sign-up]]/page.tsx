import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthLayout } from "@/components/shared/auth-layout";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  );
}
