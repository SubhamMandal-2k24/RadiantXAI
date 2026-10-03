import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

type Props = {
  to: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
};

export function AnimatedCounter({ to, decimals = 0, suffix = "", duration = 1.4 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = to.toFixed(decimals) + suffix;
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        el.textContent = v.toFixed(decimals) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, decimals, suffix, duration, reduce]);

  return <span ref={ref}>{(0).toFixed(decimals) + suffix}</span>;
}