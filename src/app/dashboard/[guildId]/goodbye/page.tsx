"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="goodbye"
      defaults={{
        channelId: "",
        useEmbed: true,
        message: "Goodbye {username}, we'll miss you ❄️",
        embedTitle: "Goodbye 👋",
        embedDescription: "{username} has left {server}. We're now {membercount} members.",
        embedColor: "#9EDCFF",
        embedImage: "",
        embedThumbnail: "",
        embedAuthor: "",
        embedFooter: "",
      }}
      preview={{ contentKey: "message", embedTitleKey: "embedTitle", embedDescKey: "embedDescription", colorKey: "embedColor" }}
      sections={[
        {
          title: "Goodbye message",
          description: "Sent when a member leaves.",
          fields: [
            { key: "channelId", label: "Channel", type: "channel", description: "Where goodbye messages are posted." },
            { key: "useEmbed", label: "Send as embed", type: "switch", description: "Use a rich embed instead of plain text." },
            { key: "message", label: "Plain text (above embed)", type: "textarea", placeholder: "Goodbye {username}!" },
          ],
        },
        {
          title: "Embed",
          description: "Customize the goodbye embed. Supports {username}, {server}, {membercount}.",
          fields: [
            { key: "embedTitle", label: "Title", type: "text", placeholder: "Goodbye 👋" },
            { key: "embedDescription", label: "Description", type: "textarea", placeholder: "{username} has left." },
            { key: "embedColor", label: "Accent color", type: "color" },
            { key: "embedAuthor", label: "Author text", type: "text", description: "Small text shown at the top of the embed." },
            { key: "embedFooter", label: "Footer text", type: "text" },
            { key: "embedThumbnail", label: "Thumbnail URL", type: "text", placeholder: "https://…/thumb.png" },
            { key: "embedImage", label: "Large image URL", type: "text", placeholder: "https://…/image.png" },
          ],
        },
      ]}
    />
  );
}
