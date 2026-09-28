const STEPS = [
  ["Upload", "You upload a frontal chest X-ray (PNG or JPEG)."],
  ["Classify", "The model outputs an independent probability for each of 14 pathologies."],
  ["Localize", "Grad-CAM highlights the image regions that drove the top finding."],
  ["Explain", "Results are shown in technical detail or plain language, depending on your account type."],
];

const METRICS = [
  ["0.776", "Macro AUC-ROC across 14 classes (11,679 validation images)"],
  ["0.184", "Mean IoU of heatmaps vs. radiologist boxes (984 annotated boxes)"],
  ["39.6%", "Pointing-game accuracy: peak activation inside the annotated box"],
  ["0.068", "Mean expected calibration error"],
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-2xl font-semibold text-text">About RadiantXAI</h1>
      <p className="mt-4 text-sm leading-relaxed text-text-dim">
        RadiantXAI is a research project on explainable AI for chest X-rays. Most classifiers only
        return a label. This one also shows where it looked and how far each prediction can be
        trusted, because a confident answer from a weak class is a different thing from a confident
        answer from a strong one.
      </p>

      <h2 className="mt-10 text-sm font-medium text-text">How it works</h2>
      <ol className="mt-4 space-y-3">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="flex gap-4 rounded-md border border-border bg-panel p-4">
            <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-sm font-medium text-text">{title}</p>
              <p className="mt-1 text-sm text-text-dim">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-10 text-sm font-medium text-text">Evaluation</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {METRICS.map(([value, label]) => (
          <div key={label} className="rounded-md border border-border bg-panel p-4">
            <p className="font-mono text-xl text-accent">{value}</p>
            <p className="mt-1 text-xs text-text-dim">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-medium text-text">Limitations</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-dim">
        <li>Accuracy varies by condition. Pneumonia (AUC 0.63) and Infiltration (0.69) are the weakest classes.</li>
        <li>The heatmap is generated for the top predicted finding only, not for every class.</li>
        <li>Grad-CAM is coarse: it localizes large or diffuse findings better than small, focal ones like nodules.</li>
        <li>This is a research prototype, not a medical device. It does not provide a diagnosis.</li>
      </ul>
    </div>
  );
}