"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck, Lock, Mic, Bot, DoorOpen, Gift, Ticket, UserPlus,
  Moon, ScrollText, Eye, Wrench,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  { icon: ShieldCheck, title: "Advanced Moderation", desc: "Warn, ban, kick, mute, purge, lock, and full mod history." },
  { icon: Lock, title: "Antinuke Security", desc: "Protect your server with whitelists and extra owners." },
  { icon: Bot, title: "Advanced AutoMod", desc: "Anti-spam, anti-link, raid protection, and smart punishments." },
  { icon: Ticket, title: "Tickets", desc: "Panel builder, claims, and full transcripts." },
  { icon: Mic, title: "Voice Master", desc: "Join-to-Create temporary voice channels with owner controls." },
  { icon: DoorOpen, title: "Welcome & Goodbye", desc: "Beautiful embeds, auto roles, and join DMs." },
  { icon: Gift, title: "Giveaways", desc: "Create, manage, and reroll giveaways in seconds." },
  { icon: UserPlus, title: "Self Roles", desc: "Reaction and button self-assignable roles." },
  { icon: Moon, title: "AFK System", desc: "Automatic AFK status and mention responses." },
  { icon: Eye, title: "Snipe", desc: "View recently deleted and edited messages." },
  { icon: ScrollText, title: "Logging", desc: "Track every event across your server." },
  { icon: Wrench, title: "Server Utilities", desc: "Info commands, embeds, polls, reminders, and more." },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
        >
          <Card hover className="h-full p-6">
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 border border-white/10">
              <f.icon className="size-5 text-arctic" />
            </div>
            <h3 className="mb-1.5 font-semibold text-snow">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
