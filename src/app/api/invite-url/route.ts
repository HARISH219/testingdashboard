import { NextResponse } from "next/server";
import { INVITE_URL } from "@/lib/env";

export async function GET() {
  return NextResponse.json({ url: INVITE_URL });
}
