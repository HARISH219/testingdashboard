"use client";
import { CommandDirectory } from "@/components/dashboard/command-directory";

const commands = [
  { name: "slap", description: "Slap another member with a GIF." },
  { name: "hug", description: "Give someone a warm hug." },
  { name: "kiss", description: "Kiss another member." },
  { name: "pat", description: "Pat someone on the head." },
  { name: "cry", description: "Show that you're crying." },
  { name: "dance", description: "Bust a move." },
  { name: "laugh", description: "Laugh out loud." },
  { name: "ship", description: "Ship two members together.", usage: "ship @a @b" },
  { name: "iq", description: "Check a member's (totally scientific) IQ." },
  { name: "cute", description: "Rate how cute someone is." },
  { name: "fakeban", description: "Prank ban message (no real action)." },
  { name: "fakekick", description: "Prank kick message (no real action)." },
];

export default function Page() {
  return <CommandDirectory moduleKey="fun" commands={commands} />;
}
