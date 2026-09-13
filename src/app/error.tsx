"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center p-4 text-center">
      <div>
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-bold text-snow">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, and if the problem persists,
          contact support.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/60">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
