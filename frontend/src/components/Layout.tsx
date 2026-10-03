import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

function Footer() {
  return (
    <footer className="relative z-10 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-text-dim">
        <p>© {new Date().getFullYear()} RadiantXAI. Research prototype.</p>
        <p className="mt-1">
          Not a medical device. Results are not a diagnosis and are not a substitute for professional
          medical advice.
        </p>
        <p className="mt-1">Sample images: NIH Clinical Center ChestX-ray14.</p>
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-70" />
        <div className="animate-drift absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="animate-drift absolute top-1/2 -right-40 h-[26rem] w-[26rem] rounded-full bg-tier-moderate/10 blur-3xl" />
      </div>
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-[60] opacity-[0.06] mix-blend-overlay" />
      <Navbar />
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}