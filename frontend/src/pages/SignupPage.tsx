import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { ROLE_LABELS, type UserRole } from "../types/auth";

const ROLES: UserRole[] = ["general", "technician"];
const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  general: "A plain-language summary of what the model found, without the jargon.",
  technician: "Full technical detail: per-class probabilities, model reliability (AUC), and localization notes.",
};

const inputClass =
  "mt-1 w-full rounded-md border border-border-strong bg-panel px-3 py-2 text-sm text-text placeholder:text-text-dim";

export function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("general");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signup(email.trim(), password, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-xl font-semibold text-text">Create an account</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm text-text-dim">
          Email
          <input type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm text-text-dim">
          Password
          <input type="password" required autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </label>

        <fieldset>
          <legend className="text-sm text-text-dim">I am a…</legend>
          <div className="mt-2 grid gap-3">
            {ROLES.map((r) => (
              <label key={r}
                className={`cursor-pointer rounded-md border p-3 ${
                  role === r ? "border-accent bg-panel-raised" : "border-border-strong bg-panel hover:bg-panel-raised"
                }`}>
                <input type="radio" name="role" value={r} checked={role === r}
                  onChange={() => setRole(r)} className="sr-only" />
                <span className="block text-sm font-medium text-text">{ROLE_LABELS[r]}</span>
                <span className="mt-1 block text-xs text-text-dim">{ROLE_DESCRIPTIONS[r]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" className="text-sm text-finding">{error}</p>}
        <button type="submit" disabled={submitting}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50">
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-text-dim">
        Already registered? <Link to="/login" className="text-accent hover:underline">Log in</Link>
      </p>
    </div>
  );
}