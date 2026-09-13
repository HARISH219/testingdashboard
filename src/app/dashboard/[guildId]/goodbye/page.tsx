"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="goodbye"
      defaults={{ channelId: "", message: "Goodbye {username}, we'll miss you ❄️", embedColor: "#9EDCFF" }}
      preview={{ contentKey: "message", colorKey: "embedColor" }}
      sections={[
        {
          title: "Goodbye message",
          description: "Sent when a member leaves.",
          fields: [
            { key: "channelId", label: "Channel", type: "channel", description: "Where goodbye messages are posted." },
            { key: "message", label: "Message", type: "textarea", placeholder: "Goodbye {username}!" },
            { key: "embedColor", label: "Accent color", type: "color" },
          ],
        },
      ]}
    />
  );
}
