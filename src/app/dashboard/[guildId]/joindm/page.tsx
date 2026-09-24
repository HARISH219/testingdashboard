"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="joindm"
      defaults={{
        useEmbed: true,
        message: "Welcome to {server}, {username}!",
        embedTitle: "Welcome to {server}! 🎉",
        embedDescription: "Hey {username}, glad to have you here. Check out the rules channel to get started.",
        embedColor: "#9EDCFF",
        embedImage: "",
        embedThumbnail: "",
        embedAuthor: "",
        embedFooter: "",
      }}
      preview={{ contentKey: "message", embedTitleKey: "embedTitle", embedDescKey: "embedDescription", colorKey: "embedColor" }}
      sections={[
        {
          title: "Direct message",
          description: "Sent privately to members when they join. Supports {username}, {server}, {membercount}.",
          fields: [
            { key: "useEmbed", label: "Send as embed", type: "switch", description: "Use a rich embed instead of plain text." },
            { key: "message", label: "Plain text (above embed)", type: "textarea", placeholder: "Welcome {username}!" },
          ],
        },
        {
          title: "Embed",
          description: "Customize the welcome DM embed.",
          fields: [
            { key: "embedTitle", label: "Title", type: "text", placeholder: "Welcome to {server}!" },
            { key: "embedDescription", label: "Description", type: "textarea", placeholder: "Hey {username}, welcome!" },
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
