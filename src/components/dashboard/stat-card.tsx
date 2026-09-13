"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon,
  hint,
  tint = "text-arctic",
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  hint?: React.ReactNode;
  tint?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card hover className="group p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-bold text-snow">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div
            className={cn(
              "grid size-10 place-items-center rounded-xl bg-white/[0.05] border border-white/[0.06] transition-colors group-hover:border-arctic/30 [&_svg]:size-5",
              tint
            )}
          >
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
