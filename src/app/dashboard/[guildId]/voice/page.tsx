"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="voice"
      defaults={{ hubChannelId: "", defaultLimit: 0, defaultBitrate: 64, voiceRoleId: "" }}
      sections={[
        {
          title: "Temp voice channels",
          description: "Join-to-create voice hub and defaults.",
          fields: [
            { key: "hubChannelId", label: "Join-to-create hub", type: "voicechannel" },
            { key: "defaultLimit", label: "Default user limit", type: "number", description: "0 = unlimited." },
            { key: "defaultBitrate", label: "Default bitrate (kbps)", type: "number" },
          ],
        },
        {
          title: "Voice role",
          description: "Assign a role while members are in voice.",
          fields: [
            { key: "voiceRoleId", label: "In-voice role", type: "role" },
          ],
        },
      ]}
    />
  );
}
