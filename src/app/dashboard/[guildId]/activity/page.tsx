"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="activity"
      defaults={{ activeRoleId: "", messageThreshold: 100, voiceMinutes: 60, cleanupInactive: true }}
      sections={[
        {
          title: "Activity roles",
          description: "Reward active members with roles automatically.",
          fields: [
            { key: "activeRoleId", label: "Active member role", type: "role" },
            { key: "messageThreshold", label: "Messages required", type: "number", description: "Messages per week to earn the role." },
            { key: "voiceMinutes", label: "Voice minutes required", type: "number" },
            { key: "cleanupInactive", label: "Remove role when inactive", type: "switch" },
          ],
        },
      ]}
    />
  );
}
