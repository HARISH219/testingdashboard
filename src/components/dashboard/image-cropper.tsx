"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, RotateCcw, Check, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Touch-friendly image cropper.
 *
 * Renders as a centered modal on desktop and a bottom sheet on mobile. Supports
 * mouse + touch drag to reposition, a zoom slider, reset, and live preview. On
 * confirm it rasterizes the visible crop to a data URL at the target output
 * size (so the caller can persist or upload it). Works entirely client-side —
 * no upload happens here; the parent decides what to do with the result.
 */

export interface CropResult {
  dataUrl: string;
  /** approximate byte size of the encoded image */
  bytes: number;
}

export function ImageCropper({
  open,
  src,
  aspect, // width / height of the crop box (1 = square/circle)
  round = false,
  outputWidth,
  title = "Adjust image",
  recommendation,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  src: string | null;
  aspect: number;
  round?: boolean;
  outputWidth: number;
  title?: string;
  recommendation?: string;
  onCancel: () => void;
  onConfirm: (result: CropResult) => void;
}) {
  const boxW = 320;
  const boxH = Math.round(boxW / aspect);

  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [natural, setNatural] = React.useState({ w: 0, h: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [saving, setSaving] = React.useState(false);
  const drag = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Base scale so the image covers the crop box at zoom = 1.
  const baseScale = React.useMemo(() => {
    if (!natural.w || !natural.h) return 1;
    return Math.max(boxW / natural.w, boxH / natural.h);
  }, [natural, boxW, boxH]);

  const scale = baseScale * zoom;
  const dispW = natural.w * scale;
  const dispH = natural.h * scale;

  // Clamp offset so the image always covers the crop box (no empty gaps).
  const clamp = React.useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(0, (dispW - boxW) / 2);
      const maxY = Math.max(0, (dispH - boxH) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [dispW, dispH, boxW, boxH]
  );

  React.useEffect(() => {
    // Reset transform whenever a new image is loaded.
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setLoaded(false);
  }, [src]);

  React.useEffect(() => {
    setOffset((o) => clamp(o.x, o.y));
  }, [clamp]);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setLoaded(true);
  };

  const startDrag = (clientX: number, clientY: number) => {
    drag.current = { x: clientX, y: clientY, ox: offset.x, oy: offset.y };
  };
  const moveDrag = (clientX: number, clientY: number) => {
    if (!drag.current) return;
    const dx = clientX - drag.current.x;
    const dy = clientY - drag.current.y;
    setOffset(clamp(drag.current.ox + dx, drag.current.oy + dy));
  };
  const endDrag = () => { drag.current = null; };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const confirm = async () => {
    if (!imgRef.current || !natural.w) return;
    setSaving(true);
    try {
      const outW = outputWidth;
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      // Map the crop box (centered over the scaled image) back to source px.
      const ratio = outW / boxW; // output px per crop-box px
      // Top-left of the crop box in display space, relative to image center.
      const cropLeft = -offset.x + (dispW - boxW) / 2;
      const cropTop = -offset.y + (dispH - boxH) / 2;
      const srcX = cropLeft / scale;
      const srcY = cropTop / scale;
      const srcW = boxW / scale;
      const srcH = boxH / scale;

      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

      const dataUrl = canvas.toDataURL("image/webp", 0.9);
      const bytes = Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
      onConfirm({ dataUrl, bytes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && src && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy/75 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="glass-strong relative z-10 w-full max-w-md rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-5"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-snow">{title}</h2>
              <button onClick={onCancel} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-snow" aria-label="Close cropper">
                <X className="size-5" />
              </button>
            </div>

            {/* Crop stage */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative cursor-grab touch-none overflow-hidden border border-white/10 bg-black/40 active:cursor-grabbing",
                  round ? "rounded-full" : "rounded-xl"
                )}
                style={{ width: boxW, height: boxH, maxWidth: "100%" }}
                onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
                onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
                onTouchMove={(e) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
                onTouchEnd={endDrag}
              >
                {!loaded && (
                  <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={src}
                  alt=""
                  onLoad={onImgLoad}
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: dispW || "auto",
                    height: dispH || "auto",
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  }}
                />
                {/* grid overlay for alignment */}
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:33.33%_33.33%]" />
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <UploadCloud className="size-3.5" /> Drag to reposition{recommendation ? ` · ${recommendation}` : ""}
              </p>

              {/* Zoom control */}
              <div className="mt-4 flex w-full items-center gap-3">
                <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-arctic"
                  aria-label="Zoom"
                />
                <Button variant="ghost" size="sm" onClick={reset} className="shrink-0">
                  <RotateCcw className="size-4" /> Reset
                </Button>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
              <Button onClick={confirm} disabled={!loaded || saving} className="flex-1 glow-btn">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Apply
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
