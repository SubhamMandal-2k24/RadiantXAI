import { useState } from "react";
import { motion } from "motion/react";
// Set src to real filenames from frontend/public/xray (the files made by make_hero_assets.py).
const SAMPLES = [
    { label: "Cardiomegaly", src: "/xray/cardiomegaly.webp" },
    { label: "Effusion", src: "/xray/effusion.webp" },
    { label: "Pneumothorax", src: "/xray/pneumothorax.webp" },
];
// The backend accepts PNG/JPEG, so re-encode the WebP thumbnail as PNG in the browser.
async function toPngFile(src, name) {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")?.drawImage(img, 0, 0);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob)
        throw new Error("Could not prepare the sample image.");
    return new File([blob], `${name}.png`, { type: "image/png" });
}
export function SampleXrays({ onPick, disabled }) {
    const [error, setError] = useState(null);
    async function pick(label, src) {
        if (disabled)
            return;
        try {
            setError(null);
            onPick(await toPngFile(src, label.toLowerCase()));
        }
        catch {
            setError("Couldn't load that sample image.");
        }
    }
    return (<div className="mt-6">
      <p className="font-mono text-xs uppercase tracking-wide text-text-dim">
        No X-ray handy? Try a sample
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {SAMPLES.map((s) => (<motion.button key={s.label} type="button" disabled={disabled} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} onClick={() => pick(s.label, s.src)} className="glass group overflow-hidden rounded-lg text-left disabled:opacity-50">
            <div className="aspect-square bg-black">
              <img src={s.src} alt={`Sample chest X-ray: ${s.label}`} loading="lazy" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"/>
            </div>
            <p className="px-2 py-1.5 font-mono text-[11px] text-text-dim group-hover:text-accent">
              {s.label}
            </p>
          </motion.button>))}
      </div>
      <p className="mt-2 text-[11px] text-text-dim">NIH ChestX-ray14 sample images.</p>
      {error && (<p role="alert" className="mt-2 text-xs text-finding">
          {error}
        </p>)}
    </div>);
}
