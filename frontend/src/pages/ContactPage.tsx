import { SITE } from "../config/site";

const LINKS = [
  { label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
  { label: "LinkedIn", value: "Subham Mandal", href: SITE.linkedin },
  { label: "GitHub", value: "SubhamMandal-2k24", href: SITE.github },
  { label: "Project repo", value: "RadiantXAI", href: SITE.repo },
];

export function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-2xl font-semibold text-text">Contact</h1>
      <p className="mt-4 text-sm text-text-dim">
        RadiantXAI is built by {SITE.author} ({SITE.affiliation}). Questions, feedback, or
        collaboration ideas are welcome.
      </p>
            <div className="mt-8 space-y-3">
        {LINKS.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
            className="flex items-center justify-between rounded-md border border-border bg-panel p-4 hover:border-accent"
          >
            <span className="text-sm text-text-dim">{l.label}</span>
            <span className="font-mono text-sm text-text">{l.value}</span>
          </a>
        ))}
      </div>
    </div>
  );
}