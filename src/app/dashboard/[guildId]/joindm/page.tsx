"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="joindm"
      defaults={{ message: "Welcome to {server}, {username}! Check out the rules channel to get started.", embedColor: "#9EDCFF" }}
      preview={{ contentKey: "message", colorKey: "embedColor" }}
      sections={[
        {
          title: "Direct message",
          description: "Sent privately to members when they join.",
          fields: [
            { key: "message", label: "Message", type: "textarea", placeholder: "Welcome {username}!" },
            { key: "embedColor", label: "Accent color", type: "color" },
          ],
        },
      ]}
    />
  );
}
