"use client";

import * as React from "react";
import {
  BotMessageSquare, UploadCloud, ImagePlus, Pencil, RotateCcw, Check,
  Loader2, MoreHorizontal, Info,
} from "lucide-react";
import { ModuleGate } from "@/components/dashboard/module-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { useModuleConfig } from "@/components/dashboard/use-module-config";
import { ImageCropper, type CropResult } from "@/components/dashboard/image-cropper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface CustomBotData extends Record<string, unknown> {
  enabled: boolean;
  botName: string;
  botUsername: string;
  botBio: string;
  avatarUrl: string; // data URL or remote URL
  bannerUrl: string;
}

const defaults: CustomBotData = {
  enabled: false,
  botName: "MROZONE",
  botUsername: "mrozone",
  botBio: "A custom Discord bot for community management, moderation, and more.",
  avatarUrl: "",
  bannerUrl: "",
};

const NAME_MAX = 32;
const USERNAME_MAX = 32;
const BIO_MAX = 300;
const ACCEPT = "image/png,image/jpeg,image/webp";

/** Reads a File into a data URL, validating type. */
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/image\/(png|jpe?g|webp)/.test(file.type)) {
      reject(new Error("Use a JPG, PNG, or WEBP image."));
      return;
    }
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsDataURL(file);
  });
}

/** Drag & drop + click upload zone. */
function UploadZone({
  onFile,
  className,
  children,
  label,
}: {
  onFile: (file: File) => void;
  className?: string;
  children: React.ReactNode;
  label: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  return (
    <div
      className={cn(
        "relative cursor-pointer rounded-2xl border border-dashed transition-colors",
        over ? "border-arctic bg-arctic/5" : "border-white/[0.12] hover:border-white/25",
        className
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
      />
      {children}
    </div>
  );
}

/* --------------------------- Live Discord preview --------------------------- */
function BotPreview({ d }: { d: CustomBotData }) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-white/[0.06] bg-[#232428] shadow-xl">
      {/* banner */}
      <div className="relative h-24 w-full bg-gradient-to-br from-arctic/40 to-navy">
        {d.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.bannerUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      {/* avatar overlaps banner */}
      <div className="px-4 pb-4">
        <div className="-mt-10 mb-2">
          <div className="relative inline-block">
            <div className="size-20 overflow-hidden rounded-full border-[6px] border-[#232428] bg-[#1e1f22]">
              {d.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-xl font-bold text-arctic">
                  {(d.botName || "B").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <span className="absolute bottom-1 right-1 size-5 rounded-full border-[3px] border-[#232428] bg-[#23a55a]" title="Online" aria-label="Online" />
          </div>
        </div>

        <div className="rounded-lg bg-[#111214] p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-white">{d.botName || "Bot name"}</span>
            <span className="rounded bg-[#5865F2] px-1 py-0.5 text-[9px] font-semibold uppercase text-white">Bot</span>
          </div>
          <p className="text-xs text-[#b5bac1]">{d.botUsername ? `@${d.botUsername}` : "@username"}</p>

          <div className="my-2.5 h-px bg-white/10" />

          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b5bac1]">About me</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#dbdee1]">
            {d.botBio || "No bio yet."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={cn("text-xs tabular-nums", value > max ? "text-destructive" : "text-muted-foreground")}>
      {value}/{max}
    </span>
  );
}

function Inner() {
  const cfg = useModuleConfig<CustomBotData>("custombot", defaults);
  const { toast } = useToast();
  const d = cfg.data;

  const [cropper, setCropper] = React.useState<
    | { kind: "avatar" | "banner"; src: string }
    | null
  >(null);
  const [uploadingBar, setUploadingBar] = React.useState<null | number>(null);

  const openCropper = async (kind: "avatar" | "banner", file: File) => {
    try {
      const src = await readImage(file);
      setCropper({ kind, src });
    } catch (e) {
      toast({ variant: "error", title: "Upload failed", description: (e as Error).message });
    }
  };

  const applyCrop = (result: CropResult) => {
    if (!cropper) return;
    // Simulate a short upload/processing pass so the user sees progress state.
    setUploadingBar(0);
    const field = cropper.kind === "avatar" ? "avatarUrl" : "bannerUrl";
    const kind = cropper.kind;
    setCropper(null);
    let p = 0;
    const timer = setInterval(() => {
      p += 25;
      setUploadingBar(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(timer);
        cfg.setField(field, result.dataUrl as never);
        setUploadingBar(null);
        toast({ variant: "success", title: `${kind === "avatar" ? "Avatar" : "Banner"} updated`, description: "Preview updated. Save changes to apply." });
      }
    }, 120);
  };

  if (cfg.loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-24 sm:pb-0">
      <PageHeader
        title="Custom Bot"
        description="Customize your bot's avatar, banner, and profile for this server."
        icon={<BotMessageSquare className="size-5" />}
        enabled={cfg.enabled}
        onEnabledChange={cfg.setEnabled}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — live preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BotMessageSquare className="size-4 text-arctic" /> Bot preview</CardTitle>
              <CardDescription>How your bot appears in Discord.</CardDescription>
            </CardHeader>
            <CardContent>
              <BotPreview d={d} />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — controls */}
        <div className="space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Bot Avatar
                <span title="Square image, PNG/JPG/WEBP up to 8MB" aria-label="Avatar requirements">
                  <Info className="size-3.5 text-muted-foreground" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative mx-auto size-24 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] sm:mx-0">
                {d.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.avatarUrl} alt="Current bot avatar" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center text-muted-foreground"><ImagePlus className="size-6" /></div>
                )}
              </div>
              <div className="flex-1">
                <UploadZone onFile={(f) => openCropper("avatar", f)} label="Upload bot avatar" className="p-4 text-center">
                  <UploadCloud className="mx-auto mb-1.5 size-5 text-arctic" />
                  <p className="text-sm font-medium text-frost">Upload image</p>
                  <p className="text-xs text-muted-foreground">Drag &amp; drop or click · PNG, JPG, WEBP · 512×512</p>
                </UploadZone>
                {d.avatarUrl && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setCropper({ kind: "avatar", src: d.avatarUrl })}>
                      <Pencil className="size-3.5" /> Recrop
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => cfg.setField("avatarUrl", "" as never)}>
                      <RotateCcw className="size-3.5" /> Remove
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Banner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Bot Banner
                <span title="Recommended 1920×480 (4:1), PNG/JPG/WEBP up to 10MB" aria-label="Banner requirements">
                  <Info className="size-3.5 text-muted-foreground" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-24 w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                {d.bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.bannerUrl} alt="Current bot banner" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center text-muted-foreground"><ImagePlus className="size-6" /></div>
                )}
              </div>
              <UploadZone onFile={(f) => openCropper("banner", f)} label="Upload bot banner" className="p-4 text-center">
                <UploadCloud className="mx-auto mb-1.5 size-5 text-arctic" />
                <p className="text-sm font-medium text-frost">Upload image</p>
                <p className="text-xs text-muted-foreground">Drag &amp; drop or click · Recommended 1920×480</p>
              </UploadZone>
              {d.bannerUrl && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setCropper({ kind: "banner", src: d.bannerUrl })}>
                    <Pencil className="size-3.5" /> Recrop
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => cfg.setField("bannerUrl", "" as never)}>
                    <RotateCcw className="size-3.5" /> Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bot Profile</CardTitle>
              <CardDescription>Name, username, and about text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Bot name</Label>
                  <Counter value={d.botName.length} max={NAME_MAX} />
                </div>
                <Input value={d.botName} maxLength={NAME_MAX} onChange={(e) => cfg.setField("botName", e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Username</Label>
                  <Counter value={d.botUsername.length} max={USERNAME_MAX} />
                </div>
                <Input value={d.botUsername} maxLength={USERNAME_MAX} onChange={(e) => cfg.setField("botUsername", e.target.value.toLowerCase().replace(/\s+/g, ""))} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Bio / About</Label>
                  <Counter value={d.botBio.length} max={BIO_MAX} />
                </div>
                <Textarea rows={4} value={d.botBio} maxLength={BIO_MAX} onChange={(e) => cfg.setField("botBio", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Upload progress + save */}
          {uploadingBar !== null && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs text-frost">
                <span className="flex items-center gap-1.5"><Loader2 className="size-3.5 animate-spin text-arctic" /> Processing image…</span>
                <span className="tabular-nums">{uploadingBar}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-arctic transition-all" style={{ width: `${uploadingBar}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={cfg.reset} disabled={!cfg.dirty || cfg.saving}>Discard</Button>
            <Button onClick={cfg.save} disabled={!cfg.dirty || cfg.saving} className="glow-btn">
              {cfg.saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <ImageCropper
        open={cropper?.kind === "avatar"}
        src={cropper?.kind === "avatar" ? cropper.src : null}
        aspect={1}
        round
        outputWidth={512}
        title="Adjust avatar"
        recommendation="512×512"
        onCancel={() => setCropper(null)}
        onConfirm={applyCrop}
      />
      <ImageCropper
        open={cropper?.kind === "banner"}
        src={cropper?.kind === "banner" ? cropper.src : null}
        aspect={4}
        outputWidth={1920}
        title="Adjust banner"
        recommendation="1920×480"
        onCancel={() => setCropper(null)}
        onConfirm={applyCrop}
      />
    </div>
  );
}

export default function Page() {
  return (
    <ModuleGate moduleKey="custombot">
      <Inner />
    </ModuleGate>
  );
}
