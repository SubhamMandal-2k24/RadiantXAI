import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-text-dim">
        <p>© {new Date().getFullYear()} RadiantXAI. Research prototype.</p>
        <p className="mt-1">
          Not a medical device. Results are not a diagnosis and are not a substitute for professional
          medical advice.
        </p>
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}