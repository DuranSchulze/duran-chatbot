import alpineDesk from "@/assets/alpine-desk.png";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { safeReturnTo } from "@/lib/return-to";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { loginRequest } from "@/api/auth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await loginRequest(username, password);
      login(token, rememberMe);
      navigate(safeReturnTo(location.state?.returnTo), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <img src={alpineDesk} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-background/40" />
      <div className="w-full max-w-md space-y-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/logo.webp" alt="Duran & Schulze" className="mb-6 h-12 w-auto object-contain" />
          <div>
            <h1 className="font-display text-[42px] font-medium text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to access the chatbot dashboard
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="graphite-card space-y-6">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-xs font-medium text-muted-foreground"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-border focus:ring-1 focus:ring-foreground transition-colors"
              placeholder="Username"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-muted-foreground"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-3.5 pr-12 text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-border focus:ring-1 focus:ring-foreground"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            <span>
              Remember me
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Keep me signed in on this device for up to 7 days.
              </span>
            </span>
          </label>

          {error && (
            <p className="rounded-control bg-secondary border border-border px-3.5 py-2.5 text-xs text-muted-foreground">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
