"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="birthday"
      defaults={{ channelId: "", message: "🎉 Happy birthday {user}! 🎂", roleId: "", pingRole: false }}
      preview={{ contentKey: "message" }}
      sections={[
        {
          title: "Birthday announcements",
          fields: [
            { key: "channelId", label: "Announcement channel", type: "channel" },
            { key: "message", label: "Birthday message", type: "textarea" },
            { key: "roleId", label: "Birthday role", type: "role", description: "Temporarily assigned on their birthday." },
            { key: "pingRole", label: "Ping @everyone", type: "switch" },
          ],
        },
      ]}
    />
  );
}
