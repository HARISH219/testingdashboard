import { Snowflake } from "lucide-react";

export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Snowflake className="size-8 animate-spin text-arctic" style={{ animationDuration: "3s" }} />
        <p className="text-sm text-muted-foreground">Loading Soward…</p>
      </div>
    </div>
  );
}
