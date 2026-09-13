"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="booster"
      defaults={{
        channelId: "",
        boostMessage: "Thank you {user} for boosting **{server}**! 💜",
        unboostMessage: "{username} stopped boosting. We appreciate the support ❄️",
        embedColor: "#f47fff",
      }}
      preview={{ contentKey: "boostMessage", colorKey: "embedColor" }}
      sections={[
        {
          title: "Boost messages",
          description: "Celebrate members who boost your server.",
          fields: [
            { key: "channelId", label: "Channel", type: "channel" },
            { key: "boostMessage", label: "Boost message", type: "textarea" },
            { key: "unboostMessage", label: "Unboost message", type: "textarea" },
            { key: "embedColor", label: "Accent color", type: "color" },
          ],
        },
      ]}
    />
  );
}
