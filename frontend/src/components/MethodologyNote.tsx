import { useState } from "react";

export function MethodologyNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-md border border-border bg-panel p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left text-xs font-medium text-text-dim"
      >
        <span>How reliable is this heatmap?</span>
        <span className="font-mono">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <p className="mt-2 text-xs leading-relaxed text-text-dim">
          Grad-CAM heatmaps localize large or diffuse findings (e.g. Cardiomegaly) reliably, but are less
          precise for small, focal findings (e.g. Nodule) — a known limitation of 7×7 spatial resolution at
          this layer, not a defect in this model. Validated against 984 radiologist-annotated bounding boxes:
          mean IoU 0.184, pointing-game accuracy 39.6%.
        </p>
      )}
    </div>
  );
}