import Link from "next/link";
// Base UI's Button has no asChild — style the link directly instead.
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-5 py-10 text-center">
      <h1 className="font-pixel text-sm tracking-widest">LOGIN FAILED</h1>
      <p className="max-w-[300px] text-sm leading-relaxed text-muted-foreground">
        The sign-in link could not be verified. It may have already been used or
        expired. Please try again.
      </p>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "w-full max-w-[300px]",
        )}
      >
        Back to start
      </Link>
    </main>
  );
}
