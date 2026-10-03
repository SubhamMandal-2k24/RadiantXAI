import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAuth } from "../context/auth-context";
import { XRAYS } from "../data/xrays";
import { AuroraCanvas } from "./AuroraCanvas";
import { XrayStage } from "./XrayStage";
import { PRIMARY_BTN, SECONDARY_BTN } from "./buttonStyles";

const EASE = [0.22, 1, 0.36, 1] as const;
const CYCLE_MS = 5200;

function Line({ children, delay }: { children: ReactNode; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="block overflow-hidden pb-[0.1em]">
      <motion.span className="block"
        initial={reduce ? false : { y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const { isAuthenticated } = useAuth();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const n = XRAYS.length;

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), CYCLE_MS);
    return () => clearInterval(id);
  }, [active, reduce, n]);

  const label = XRAYS[active % n].label;

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 72% 28%, rgba(124,92,255,0.35), transparent), radial-gradient(50% 40% at 18% 62%, rgba(56,225,245,0.16), transparent), #060818",
          maskImage: "linear-gradient(to bottom, black 62%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black 62%, transparent)",
        }}
      >
        <AuroraCanvas className="h-full w-full" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
        <div>
          <motion.span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-text-dim"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Explainable chest X-ray AI
          </motion.span>

          <h1 className="mt-6 whitespace-nowrap font-display text-4xl leading-[1.1] text-text sm:text-5xl lg:text-[3.4rem]">
            <Line delay={0.15}>The model sees</Line>
            <span className="relative block h-[1.25em] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span key={label} className="text-shimmer absolute inset-0 block pb-[0.12em]"
                  initial={{ y: "105%", opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: "-105%", opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  {label}.
                </motion.span>
              </AnimatePresence>
            </span>
            <Line delay={0.35}>Now so can you.</Line>
          </h1>

          <motion.p className="mt-6 max-w-lg text-base leading-relaxed text-text-dim"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            Upload a frontal chest X-ray and get probabilities for 14 pathologies, with a heatmap
            showing the regions behind the top finding, and honest reliability scores for each.
          </motion.p>

          <motion.div className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
          >
            <Link to={isAuthenticated ? "/dashboard" : "/signup"} className={PRIMARY_BTN}>
              {isAuthenticated ? "Go to dashboard" : "Get started"}
            </Link>
            {!isAuthenticated && <Link to="/login" className={SECONDARY_BTN}>Log in</Link>}
            <Link to="/about" className="px-3 py-2.5 text-sm text-text-dim transition hover:text-text">
              How it works →
            </Link>
          </motion.div>

          <motion.div className="mt-10 flex flex-wrap gap-x-4 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            {XRAYS.map((x, i) => (
              <button key={x.label} onClick={() => setActive(i)}
                className={`relative pb-1 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                  i === active ? "text-text" : "text-text-dim hover:text-text"
                }`}
              >
                {x.label}
                {i === active && (
                  <motion.span key={`bar-${active}`} className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: reduce ? 0 : CYCLE_MS / 1000, ease: "linear" }}
                  />
                )}
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
        >
          <XrayStage active={active} />
        </motion.div>
      </div>
    </section>
  );
}