import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/auth-context";
const inputClass = "mt-1.5 w-full rounded-md border border-border-strong bg-panel/70 px-3 py-2.5 text-sm text-text placeholder:text-text-dim transition-colors focus:border-accent";
export function LoginPage() {
    const { login, isAuthenticated } = useAuth();
    const location = useLocation();
    const from = location.state?.from?.pathname ?? "/dashboard";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    if (isAuthenticated)
        return <Navigate to={from} replace/>;
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email.trim(), password);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setSubmitting(false);
        }
    }
    return (<div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-wide text-accent">RadiantXAI</p>
        <h1 className="font-display mt-2 text-3xl text-text">Log in</h1>
      </motion.div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass glow-accent mt-6 space-y-5 rounded-xl p-6">
        <label className="block text-sm text-text-dim">
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass}/>
        </label>
        <label className="block text-sm text-text-dim">
          Password
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass}/>
        </label>
        {error && (<p role="alert" className="text-sm text-finding">
            {error}
          </p>)}
        <button type="submit" disabled={submitting} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50">
          {submitting ? "Logging in…" : "Log in"}
        </button>
        <p className="text-center text-sm text-text-dim">
          No account?{" "}
          <Link to="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </motion.form>
    </div>);
}
