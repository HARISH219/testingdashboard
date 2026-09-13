"use client";

import { motion } from "framer-motion";
import { Users, ShieldCheck, Music, Activity } from "lucide-react";

/** A stylized, static preview of the dashboard for the hero section. */
export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative mx-auto w-full max-w-4xl"
      style={{ perspective: 1200 }}
    >
      <div className="glass-strong overflow-hidden rounded-2xl p-3 shadow-glass">
        <div className="rounded-xl border border-white/[0.06] bg-navy/60 p-4">
          {/* fake top bar */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="size-2.5 rounded-full bg-white/20" />
            </div>
            <div className="ml-3 h-5 w-40 rounded-md bg-white/[0.05]" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Users, label: "Members", value: "1,284", tint: "text-arctic" },
              { icon: ShieldCheck, label: "Bot Status", value: "Online", tint: "text-success" },
              { icon: Activity, label: "Mod Actions", value: "248", tint: "text-ice" },
              { icon: Music, label: "Music", value: "Playing", tint: "text-arctic" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3">
                <s.icon className={`mb-2 size-4 ${s.tint}`} />
                <div className="text-lg font-bold text-snow">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="glass col-span-2 rounded-xl p-4">
              <div className="mb-3 h-3 w-24 rounded bg-white/10" />
              <div className="flex h-24 items-end gap-1.5">
                {[40, 65, 45, 80, 55, 90, 70, 60, 85, 50, 75, 95].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                    className="flex-1 rounded-t bg-gradient-to-t from-arctic/30 to-arctic/70"
                  />
                ))}
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="mb-3 h-3 w-16 rounded bg-white/10" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-white/[0.06]" />
                    <div className="h-2 flex-1 rounded bg-white/[0.06]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-arctic/10 blur-3xl" />
    </motion.div>
  );
}
