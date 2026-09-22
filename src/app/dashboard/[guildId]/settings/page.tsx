"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="settings"
      defaults={{ prefix: "!", timezone: "UTC", retentionDays: 30 }}
      sections={[
        {
          title: "General",
          description: "Core server configuration for Soward.",
          fields: [
            { key: "prefix", label: "Command prefix", type: "text", placeholder: "!" },
            { key: "timezone", label: "Timezone", type: "select", options: [
              { value: "UTC", label: "UTC" },
              { value: "America/New_York", label: "America/New_York" },
              { value: "Europe/London", label: "Europe/London" },
              { value: "Asia/Kolkata", label: "Asia/Kolkata" },
              { value: "Asia/Tokyo", label: "Asia/Tokyo" },
            ] },
          ],
        },
        {
          title: "Data retention",
          description: "How long configuration is preserved after a downgrade.",
          fields: [
            { key: "retentionDays", label: "Retention (days)", type: "number", description: "Config is kept this long before cleanup. 0 keeps forever." },
          ],
        },
      ]}
    />
  );
}
