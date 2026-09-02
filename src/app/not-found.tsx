import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="font-heading text-xl font-semibold">Page not found</h2>
      <p className="max-w-sm text-muted-foreground">
        This page does not exist, or it was moved. The tools are all on the
        home page.
      </p>
      <Button render={<Link href="/" />}>Go to the home page</Button>
    </div>
  );
}
