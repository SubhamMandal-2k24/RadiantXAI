import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/auth-context";
import { ROLE_LABELS } from "../types/auth";
const ROLES = ["general", "technician"];
const ROLE_DESCRIPTIONS = {
    general: "Plain-language summary",
    technician: "Medical Technical detail",
};
const inputClass = "mt-1.5 w-full rounded-md border border-border-strong bg-panel/70 px-3 py-2.5 text-sm text-text placeholder:text-text-dim transition-colors focus:border-accent";
export function SignupPage() {
    const { signup, isAuthenticated } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("general");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    if (isAuthenticated)
        return <Navigate to="/dashboard" replace/>;
    async function handleSubmit(e) {
        e.preventDefault();
        if (password.length < 5 || password.length > 12) {
            setError("Password must be between 8 and 72 characters.");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await signup(email.trim(), password, role);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setSubmitting(false);
        }
    }
    return (<div className="mx-auto max-w-md space-y-12 px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display mt-2 text-3xl text-text">Create an account</h1>
      </motion.div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass glow-accent space-y-5 rounded-xl p-6">
        <label className="block text-sm text-text-dim">
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass}/>
        </label>
        <label className="block text-sm text-text-dim">
          Password
          <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass}/>
        </label>

        <fieldset>
          <legend className="text-sm text-text-dim">I am</legend>
          <div className="mt-2 grid gap-3">
            {ROLES.map((r) => (<label key={r} className={`cursor-pointer rounded-lg border p-4 transition-colors ${role === r
                ? "border-accent bg-panel-raised"
                : "border-border-strong bg-panel/60 hover:bg-panel-raised"}`}>
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only"/>
                <span className="flex items-center justify-between">
                  <span className="font-display text-sm text-text">{ROLE_LABELS[r]}</span>
                  <span className={`h-2.5 w-2.5 rounded-full border ${role === r ? "border-accent bg-accent" : "border-border-strong"}`}/>
                </span>
                <span className="mt-1.5 block text-xs text-text-dim">{ROLE_DESCRIPTIONS[r]}</span>
              </label>))}
          </div>
        </fieldset>

        {error && (<p role="alert" className="text-sm text-finding">
            {error}
          </p>)}
        <button type="submit" disabled={submitting} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50">
          {submitting ? "Creating account…" : "Sign up"}
        </button>
        <p className="text-center text-sm text-text-dim">
          Already registered?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </motion.form>
    </div>);
}
