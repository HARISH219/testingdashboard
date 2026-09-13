"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="autonick"
      defaults={{ template: "❄️ {username}", excludedRoles: [] }}
      sections={[
        {
          title: "Nickname template",
          description: "Applied automatically to new members. Use {username} for their name.",
          fields: [
            { key: "template", label: "Template", type: "text", placeholder: "❄️ {username}" },
            { key: "excludedRoles", label: "Excluded roles", type: "roles", description: "Members with these roles keep their nickname." },
          ],
        },
      ]}
    />
  );
}
