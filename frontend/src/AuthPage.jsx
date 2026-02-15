import { useState } from "react";
import { API_BASE } from "./auth";

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setEmail("");
    setPassword("");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "login" : "register";
      const res = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Authentication failed");
        return;
      }

      onAuthenticated(data.token, data.user);
    } catch {
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl w-full max-w-md p-6 space-y-5">
        <div>
          <h1 className="font-display text-3xl tracking-tight">LinkVault</h1>
          <p className="text-sm text-slate-600 mt-1">
            Sign in to manage your private links.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden">
          <button
            className={`px-4 py-2 text-sm ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600"
            }`}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            className={`px-4 py-2 text-sm ${
              mode === "register"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600"
            }`}
            onClick={() => switchMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder={
              mode === "register" ? "Password (min 8 chars)" : "Password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={loading}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
              loading
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
