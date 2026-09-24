"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="media"
      defaults={{ channelId: "", allowLinks: false, bypassRoles: [], allowedAdminRoles: [] }}
      sections={[
        {
          title: "Media-only channel",
          description: "Only allow images and attachments in the selected channel.",
          fields: [
            { key: "channelId", label: "Media channel", type: "channel" },
            { key: "allowLinks", label: "Allow links", type: "switch" },
            { key: "bypassRoles", label: "Bypass roles", type: "roles", description: "These roles can post normally." },
          ],
        },
        {
          title: "Allowed admins",
          description: "Roles allowed to manage the media channel and moderate its content.",
          fields: [
            { key: "allowedAdminRoles", label: "Admin roles", type: "roles", description: "These roles can manage media settings and remove posts." },
          ],
        },
      ]}
    />
  );
}
