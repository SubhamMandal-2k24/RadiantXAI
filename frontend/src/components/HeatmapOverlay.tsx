import { useState } from "react";

interface HeatmapOverlayProps {
  originalUrl: string;
  heatmapUrl: string;
}

export function HeatmapOverlay({ originalUrl, heatmapUrl }: HeatmapOverlayProps) {
  const [blend, setBlend] = useState(60);

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border bg-black">
        <img src={originalUrl} alt="Uploaded chest X-ray" className="absolute inset-0 h-full w-full object-contain" />
        <img src={heatmapUrl} alt="Grad-CAM localization heatmap" className="absolute inset-0 h-full w-full object-contain transition-opacity duration-150" style={{ opacity: blend / 100 }} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="font-mono text-xs text-text-dim">X-ray</span>
        <input type="range" min={0} max={100} value={blend} onChange={(e) => setBlend(Number(e.target.value))} className="flex-1 accent-accent" aria-label="Blend between original X-ray and Grad-CAM heatmap" />
        <span className="font-mono text-xs text-text-dim">Heatmap</span>
      </div>
    </div>
  );
}
