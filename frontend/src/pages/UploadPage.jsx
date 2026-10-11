import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { UploadCard } from "../components/UploadCard";
import { AnalyzingStage } from "../components/AnalyzingStage";
import { PathologyCoverage } from "../components/PathologyCoverage";
import { usePrediction } from "../hooks/usePrediction";
import { useAuth } from "../context/auth-context";
import { ApiError } from "../api/client";
function errorMessage(error) {
    if (error instanceof ApiError) {
        if (error.status === 503) {
            return "The analysis model isn't ready yet on the server. Try again in a moment.";
        }
        if (error.status === 413) {
            return "That file is too large for the server to accept.";
        }
        if (error.status === 415) {
            return "The server couldn't process that file type. Try a PNG or JPEG.";
        }
        if (error.status === 0) {
            return error.message;
        }
    }
    return error.message;
}
function Reveal({ children, delay = 0 }) {
    return (<motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.45, delay }}>
      {children}
    </motion.div>);
}
function SectionTitle({ eyebrow, title }) {
    return (<div className="mb-4">
      <p className="font-mono text-xs uppercase tracking-wide text-accent">{eyebrow}</p>
      <h2 className="font-display mt-1 text-xl text-text">{title}</h2>
    </div>);
}
const STATS = [
    { value: "14", label: "pathologies" },
    { value: "0.776", label: "macro AUC" },
    { value: "0.068", label: "mean ECE" },
    { value: "0.184", label: "mean IoU" },
];
const STEPS = [
    {
        title: "Upload",
        body: "Choose a frontal chest X-ray. It is resized and normalized exactly as during training.",
    },
    {
        title: "Screen",
        body: "ResNet-50 scores the image against 14 thoracic pathologies at once.",
    },
    {
        title: "Explain",
        body: "Grad-CAM highlights the regions that drove the top prediction.",
    },
    {
        title: "Review",
        body: "Read the results in the view that matches your role.",
    },
];
const OUTPUTS = {
    technician: [
        { title: "Probabilities for all 14 classes", body: "Sorted from most to least likely, each with its own flag threshold and an AUC reliability color." },
        { title: "Grad-CAM localization", body: "Blend or side-by-side overlay of the heatmap on your X-ray for the top predicted finding." },
        { title: "Methodology note", body: "Localization IoU and pointing-game results, so you can judge how far to trust the heatmap." },
    ],
    general: [
        { title: "Plain-language summary", body: "The most likely findings explained in simple wording instead of raw numbers." },
        { title: "Visual heatmap", body: "The regions of the X-ray the model paid most attention to." },
        { title: "Clear next-step wording", body: "A reminder that results are informational and should be reviewed by a doctor." },
    ],
};
const TIPS = [
    "Use a frontal (PA or AP) chest X-ray.",
    "PNG or JPEG, up to 10 MB.",
    "Upload the image file itself, not a photo of a screen or printed film.",
    "One image per analysis; upload another after viewing the result.",
];
export function UploadPage({ onResult }) {
    const { mutate, isPending, error } = usePrediction();
    const { logout, role } = useAuth();
    const [previewUrl, setPreviewUrl] = useState(null);
    const isTechnician = role === "technician";
    useEffect(() => {
        if (error?.status === 401)
            logout();
    }, [error, logout]);
    useEffect(() => {
        return () => {
            if (previewUrl)
                URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);
    function handleFile(file) {
        setPreviewUrl(URL.createObjectURL(file));
        mutate(file, { onSuccess: onResult });
    }
    const analyzing = isPending && previewUrl;
    const outputs = isTechnician ? OUTPUTS.technician : OUTPUTS.general;
    return (<div className="mx-auto max-w-3xl space-y-14 px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-wide text-accent">RadiantXAI</p>
          <span className="rounded-full border border-border-strong px-3 py-1 font-mono text-xs text-accent">
            {isTechnician ? "Technician view" : "General view"}
          </span>
        </div>
        <h1 className="font-display mt-2 text-3xl text-text">Analysis workspace</h1>
        <p className="mt-2 text-sm text-text-dim">
          Upload a frontal chest X-ray. The model screens for 14 pathologies and highlights the
          regions it based its findings on.
        </p>
      </motion.div>

      <section>
        <AnimatePresence mode="wait">
          <motion.div key={analyzing ? "analyzing" : "upload"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            {analyzing ? (<AnalyzingStage previewUrl={previewUrl}/>) : (<UploadCard onFileSelected={handleFile} disabled={isPending}/>)}
          </motion.div>
        </AnimatePresence>
        {error && (<p role="alert" className="mt-4 text-sm text-finding">
            {errorMessage(error)}
          </p>)}
      </section>

      <Reveal>
        <div className="glass grid grid-cols-2 gap-4 rounded-xl p-5 sm:grid-cols-4">
          {STATS.map((s) => (<div key={s.label} className="text-center">
              <p className="font-display text-gradient text-2xl">{s.value}</p>
              <p className="mt-1 text-xs text-text-dim">{s.label}</p>
            </div>))}
        </div>
      </Reveal>

      <section>
        <Reveal>
          <SectionTitle eyebrow="Process" title="How an analysis works"/>
        </Reveal>
        <div className="space-y-3">
          {STEPS.map((s, i) => (<Reveal key={s.title} delay={i * 0.05}>
              <div className="glass flex gap-4 rounded-xl p-5">
                <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-base text-text">{s.title}</h3>
                  <p className="mt-1 text-sm text-text-dim">{s.body}</p>
                </div>
              </div>
            </Reveal>))}
        </div>
      </section>

      <section>
        <Reveal>
          <SectionTitle eyebrow="Output" title="What you'll get"/>
        </Reveal>
        <div className="space-y-3">
          {outputs.map((o, i) => (<Reveal key={o.title} delay={i * 0.05}>
              <div className="glass rounded-xl p-5">
                <h3 className="font-display text-base text-text">{o.title}</h3>
                <p className="mt-1 text-sm text-text-dim">{o.body}</p>
              </div>
            </Reveal>))}
        </div>
      </section>

      <Reveal>
        <PathologyCoverage />
      </Reveal>

      <section>
        <Reveal>
          <SectionTitle eyebrow="Guidance" title="For best results"/>
        </Reveal>
        <Reveal delay={0.05}>
          <ul className="glass space-y-3 rounded-xl p-5">
            {TIPS.map((t) => (<li key={t} className="flex gap-3 text-sm text-text-dim">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"/>
                {t}
              </li>))}
          </ul>
        </Reveal>
      </section>

      <Reveal>
        <p className="text-center text-xs text-text-dim">
          RadiantXAI is a research and educational project. It is not a medical device and is not
          intended for diagnosis or treatment decisions.
        </p>
      </Reveal>
    </div>);
}
