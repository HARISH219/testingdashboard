import Link from "next/link";
import { Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Snowfall } from "@/components/snowfall";

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-4 text-center">
      <Snowfall density={40} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
      <div className="relative z-10">
        <Snowflake className="mx-auto mb-6 size-14 text-arctic animate-float" />
        <h1 className="font-display text-7xl font-bold text-gradient-arctic">404</h1>
        <p className="mt-3 text-lg text-frost">This page drifted away in the snow.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
