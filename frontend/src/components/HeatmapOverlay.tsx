import { useState } from "react";

interface HeatmapOverlayProps {
  originalUrl: string;
  heatmapUrl: string;
  topLabel: string;
}

type ViewMode = "blend" | "side-by-side";

export function HeatmapOverlay({ originalUrl, heatmapUrl, topLabel }: HeatmapOverlayProps) {
  const [blend, setBlend] = useState(60);
  const [mode, setMode] = useState<ViewMode>("blend");

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-xs text-text-dim">
          Heatmap shown for: <span className="text-accent">{topLabel.replace(/_/g, " ")}</span>
        </p>
        <div className="flex overflow-hidden rounded-md border border-border-strong text-xs">
          <button
            onClick={() => setMode("blend")}
            className={`px-2 py-1 ${mode === "blend" ? "bg-accent text-black" : "text-text-dim"}`}
          >
            Blend
          </button>
          <button
            onClick={() => setMode("side-by-side")}
            className={`px-2 py-1 ${mode === "side-by-side" ? "bg-accent text-black" : "text-text-dim"}`}
          >
            Side-by-side
          </button>
        </div>
      </div>

      {mode === "blend" ? (
        <>
          <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border bg-black">
            <img src={originalUrl} alt="Uploaded chest X-ray" className="absolute inset-0 h-full w-full object-contain" />
            <img
              src={heatmapUrl}
              alt="Grad-CAM localization heatmap"
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-150"
              style={{ opacity: blend / 100 }}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-xs text-text-dim">X-ray</span>
            <input
              type="range"
              min={0}
              max={100}
              value={blend}
              onChange={(e) => setBlend(Number(e.target.value))}
              className="flex-1 accent-accent"
              aria-label="Blend between original X-ray and Grad-CAM heatmap"
            />
            <span className="font-mono text-xs text-text-dim">Heatmap</span>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="aspect-square overflow-hidden rounded-md border border-border bg-black">
            <img src={originalUrl} alt="Uploaded chest X-ray" className="h-full w-full object-contain" />
          </div>
          <div className="aspect-square overflow-hidden rounded-md border border-border bg-black">
            <img src={heatmapUrl} alt="Grad-CAM localization heatmap" className="h-full w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}