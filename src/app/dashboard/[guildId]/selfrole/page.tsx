"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="selfrole"
      defaults={{ channelId: "", genderRoles: [], gameRoles: [], style: "buttons" }}
      sections={[
        {
          title: "Self role panels",
          description: "Let members assign their own roles.",
          fields: [
            { key: "channelId", label: "Panel channel", type: "channel" },
            { key: "style", label: "Style", type: "select", options: [
              { value: "buttons", label: "Buttons" },
              { value: "reactions", label: "Reactions" },
              { value: "dropdown", label: "Dropdown menu" },
            ] },
          ],
        },
        {
          title: "Role groups",
          fields: [
            { key: "genderRoles", label: "Gender roles", type: "roles" },
            { key: "gameRoles", label: "Game roles", type: "roles" },
          ],
        },
      ]}
    />
  );
}
