import { NextResponse } from "next/server";
import { getSessionUser, getManageableGuildsForUser } from "@/lib/authz";
import { DEMO_MODE } from "@/lib/env";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const guilds = await getManageableGuildsForUser(user);
    return NextResponse.json({ guilds, demo: DEMO_MODE });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to load guilds", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
