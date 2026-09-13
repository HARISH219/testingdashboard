"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="general"
      defaults={{
        afkEnabled: true,
        snipeEnabled: true,
        memberCountChannelId: "",
        staffRole: "", vipRole: "", guestRole: "",
      }}
      sections={[
        {
          title: "Utilities",
          fields: [
            { key: "afkEnabled", label: "AFK system", type: "switch", description: "Let members set an AFK status." },
            { key: "snipeEnabled", label: "Snipe", type: "switch", description: "Allow sniping deleted/edited messages." },
            { key: "memberCountChannelId", label: "Member count channel", type: "voicechannel", description: "A channel that shows live member count." },
          ],
        },
        {
          title: "Setup roles",
          description: "Configure staff, VIP, and guest roles.",
          fields: [
            { key: "staffRole", label: "Staff role", type: "role" },
            { key: "vipRole", label: "VIP role", type: "role" },
            { key: "guestRole", label: "Guest role", type: "role" },
          ],
        },
      ]}
    />
  );
}
