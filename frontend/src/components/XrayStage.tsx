import type { PointerEvent } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { XRAYS } from "../data/xrays";

export function XrayStage({ active }: { active: number }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 18 });
  const sy = useSpring(my, { stiffness: 110, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const backX = useTransform(sx, [-0.5, 0.5], [22, -22]);
  const backY = useTransform(sy, [-0.5, 0.5], [14, -14]);

  const n = XRAYS.length;
  const item = XRAYS[active % n];
  const prev = XRAYS[(active + n - 1) % n];
  const next = XRAYS[(active + 1) % n];
  const b = item.box;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const glow = Math.max(16, Math.max(b.w, b.h) * 1.7);
  const chipBelow = b.y < 14;
  const chipRight = cx > 55;
  const chipPos = {
    top: `${chipBelow ? b.y + b.h : b.y}%`,
    ...(chipRight ? { right: `${100 - b.x - b.w}%` } : { left: `${b.x}%` }),
  };

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div className="relative mx-auto w-full max-w-[30rem]"
      style={{ perspective: 1200 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <motion.div aria-hidden="true"
        className="absolute -left-8 top-12 hidden w-[58%] overflow-hidden rounded-xl border border-border opacity-40 sm:block"
        style={{ x: reduce ? 0 : backX, y: reduce ? 0 : backY, rotate: -7 }}
      >
        <img src={prev.src} alt="" className="aspect-square w-full object-cover" />
      </motion.div>
      <motion.div aria-hidden="true"
        className="absolute -right-8 bottom-4 hidden w-[52%] overflow-hidden rounded-xl border border-border opacity-40 sm:block"
        style={{ x: reduce ? 0 : backX, y: reduce ? 0 : backY, rotate: 8 }}
      >
        <img src={next.src} alt="" className="aspect-square w-full object-cover" />
      </motion.div>

      <motion.div className="glass glow-accent relative rounded-2xl p-3"
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <div className="mb-2 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-wide text-text-dim">
          <span>Frame {String((active % n) + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            {item.label}
          </span>
        </div>

        <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
          <AnimatePresence>
            <motion.div key={item.label} className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div className="absolute inset-0"
                initial={{ scale: 1.02 }}
                animate={{ scale: reduce ? 1.02 : 1.09 }}
                transition={{ duration: 7, ease: "linear" }}
              >
                <img src={item.src} alt={`Chest X-ray with annotated ${item.label}`}
                  className="h-full w-full object-cover"
                />
                <motion.div className="absolute rounded-full"
                  style={{
                    left: `${cx}%`,
                    top: `${cy}%`,
                    width: `${glow}%`,
                    height: `${glow}%`,
                    x: "-50%",
                    y: "-50%",
                    mixBlendMode: "screen",
                    background:
                      "radial-gradient(circle, rgba(217,97,63,0.8) 0%, rgba(230,170,60,0.45) 38%, rgba(43,179,163,0.2) 62%, transparent 72%)",
                  }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                />
                <motion.div className="absolute border border-accent shadow-[0_0_22px_rgba(43,179,163,0.7)]"
                  style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                  initial={{ opacity: 0, scale: 1.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
                <div className={`absolute ${chipBelow ? "mt-1.5" : "-mt-1.5 -translate-y-full"}`}
                  style={chipPos}
                >
                  <motion.div className="whitespace-nowrap rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-accent"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                  >
                    {item.label} · annotated
                  </motion.div>
                </div>
              </motion.div>

              {!reduce && (
                <motion.div className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 82%, rgba(43,179,163,0.35) 97%, #2bb3a3 100%)",
                  }}
                  initial={{ y: "-100%", opacity: 1 }}
                  animate={{ y: ["-100%", "0%"], opacity: [1, 1, 0] }}
                  transition={{ duration: 1.7, ease: "easeInOut", times: [0, 0.85, 1] }}
                />
              )}
            </motion.div>
          </AnimatePresence>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
        </div>

        <p className="mt-2 px-1 font-mono text-[10px] uppercase tracking-wide text-text-dim">
          Annotated region · NIH ground truth
        </p>
      </motion.div>
    </div>
  );
}