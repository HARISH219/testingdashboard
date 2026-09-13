"use client";

import { motion } from "framer-motion";

/** Simple animated bar chart (no external deps) for the overview. */
export function ActivityChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-40 items-end gap-1.5">
      {data.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ delay: i * 0.03, duration: 0.5, ease: "easeOut" }}
          className="group relative flex-1 rounded-t-md bg-gradient-to-t from-arctic/25 to-arctic/70 hover:from-arctic/40 hover:to-arctic"
        >
          <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-popover px-1.5 py-0.5 text-[10px] text-snow opacity-0 transition-opacity group-hover:opacity-100">
            {v}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
