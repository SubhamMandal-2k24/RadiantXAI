import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { ROLE_LABELS } from "../types/auth";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors ${isActive ? "text-text" : "text-text-dim hover:text-text"}`;

export function Navbar() {
  const { isAuthenticated, session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="border-b border-border bg-bg">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-6 py-4">
        <Link to="/" className="font-mono text-sm uppercase tracking-wide text-accent">
          RadiantXAI
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <span className="hidden font-mono text-xs text-text-dim sm:inline">
                {session ? ROLE_LABELS[session.role] : ""}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-text-dim hover:border-accent hover:text-text"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <Link
                to="/signup"
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-black hover:opacity-90"
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