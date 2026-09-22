import { NextRequest, NextResponse } from "next/server";
import { COMMANDS, COMMAND_CATEGORIES, searchCommands } from "@/lib/commands";

/**
 * Public, read-only command registry endpoint.
 * It is generated from the same MODULES-backed source as the UI, so external
 * docs/integrations can never drift from the command explorer.
 */
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const category = request.nextUrl.searchParams.get("category") ?? "all";
  const commands = searchCommands(search, category);

  return NextResponse.json(
    {
      commands,
      categories: COMMAND_CATEGORIES,
      total: COMMANDS.length,
      matched: commands.length,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  );
}
