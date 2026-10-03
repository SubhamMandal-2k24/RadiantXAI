import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/auth-context";
import { ROLE_LABELS } from "../types/auth";

function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `relative px-0.5 py-1 text-sm transition-colors ${isActive ? "text-text" : "text-text-dim hover:text-text"}`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <motion.span layoutId="nav-underline" className="absolute inset-x-0 -bottom-0.5 h-px bg-accent" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function Navbar() {
  const { isAuthenticated, session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="glass sticky top-0 z-50 border-x-0 border-t-0">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm uppercase tracking-wide text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          RadiantXAI
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
          <NavItem to="/" end>Home</NavItem>
          <NavItem to="/about">About</NavItem>
          <NavItem to="/contact">Contact</NavItem>
          {isAuthenticated ? (
            <>
              <NavItem to="/dashboard">Dashboard</NavItem>
              <span className="hidden font-mono text-xs text-text-dim sm:inline">
                {session ? ROLE_LABELS[session.role] : ""}
              </span>
              <button onClick={handleLogout}
                className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-text-dim transition hover:border-accent hover:text-text"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavItem to="/login">Log in</NavItem>
              <Link to="/signup"
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-black transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}