"use client";

import * as React from "react";

/**
 * Global cosmic background. Mounted ONCE (in providers) so it never reloads or
 * visually jumps when navigating between routes. Layers, back to front:
 *   1. CSS radial nebula glows + a couple of soft orbs (cheap, static-ish).
 *   2. Slowly rotating orbital ring lines (CSS transform animation).
 *   3. A single canvas of twinkling stars + gently floating particles.
 *
 * Performance & accessibility:
 *   - Respects prefers-reduced-motion (renders a static starfield, no rAF loop).
 *   - Reduces star/particle counts on small screens and low-core devices.
 *   - pointer-events-none and fixed behind all content (z -10), so it never
 *     blocks interaction and dashboards stay readable.
 */
export function CosmicBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.innerWidth < 768;
    const lowCore = (navigator.hardwareConcurrency ?? 8) <= 4;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // Scale counts to the device so phones/low-power machines stay smooth.
    const base = isSmall ? 70 : 150;
    const starCount = lowCore ? Math.round(base * 0.6) : base;
    const particleCount = reduce ? 0 : isSmall ? 10 : lowCore ? 14 : 22;

    interface Star { x: number; y: number; r: number; base: number; amp: number; phase: number; speed: number }
    interface Particle { x: number; y: number; r: number; vx: number; vy: number; o: number }

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(0.4, 1.6),
      base: rand(0.25, 0.7),
      amp: rand(0.1, 0.4),
      phase: Math.random() * Math.PI * 2,
      speed: rand(0.6, 1.8),
    }));

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(1.2, 3),
      vx: rand(-0.12, 0.12),
      vy: rand(-0.25, -0.05),
      o: rand(0.15, 0.5),
    }));

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Static render path for reduced motion — draw once, no animation loop.
    if (reduce) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 240, 255, ${s.base})`;
        ctx.fill();
      }
      return () => window.removeEventListener("resize", onResize);
    }

    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      // Twinkling stars.
      for (const s of stars) {
        const o = s.base + Math.sin(t * s.speed + s.phase) * s.amp;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 240, 255, ${Math.max(0.05, o)})`;
        ctx.fill();
      }

      // Floating glowing particles (blue/cyan).
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 165, 250, ${p.o})`;
        ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Nebula glows + soft orbs */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 15% 0%, rgba(37,99,235,0.14), transparent 60%)," +
            "radial-gradient(50% 45% at 88% 8%, rgba(14,165,233,0.10), transparent 60%)," +
            "radial-gradient(70% 60% at 50% 115%, rgba(37,99,235,0.12), transparent 60%)",
        }}
      />
      <div className="absolute -left-24 top-1/4 size-72 rounded-full bg-arctic/10 blur-3xl" />
      <div className="absolute -right-24 top-1/3 size-72 rounded-full bg-ice/10 blur-3xl" />

      {/* Slowly rotating orbital lines */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit">
        <div className="size-[900px] rounded-full border border-white/[0.04]" />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit" style={{ animationDuration: "140s", animationDirection: "reverse" }}>
        <div className="size-[1300px] rounded-full border border-arctic/[0.05]" />
      </div>

      {/* Stars + particles canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Keep the very centre calm so content stays readable */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "radial-gradient(45% 40% at 50% 40%, rgba(10,10,11,0.55), transparent 70%)" }}
      />
    </div>
  );
}
