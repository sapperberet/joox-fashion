"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type Mode = "signin" | "signup" | "forgot" | "reset";

export default function AuthClient() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setMessage("Auth is not configured.");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/account");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      }
      if (event === "SIGNED_IN") {
        router.replace("/account");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const handleGoogle = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setMessage("Auth is not configured.");
      return;
    }

    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    });
    if (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setMessage("Auth is not configured.");
      return;
    }

    setLoading(true);
    setMessage("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      router.replace("/account");
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setLoading(false);
        setMessage("Passwords do not match.");
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Check your email to verify account.");
      return;
    }

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      setLoading(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Password reset email sent.");
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setMessage("Passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Password updated. You can sign in now.");
    setMode("signin");
  };

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <h1 className="font-display text-3xl tracking-[0.2em] text-gold">Account Access</h1>
          <div className="mt-4 grid grid-cols-4 gap-2 text-[0.6rem] uppercase tracking-[0.15em]">
            {[
              { id: "signin", label: "Sign In" },
              { id: "signup", label: "Sign Up" },
              { id: "forgot", label: "Forgot" },
              { id: "reset", label: "Reset" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id as Mode)}
                className={`rounded-full px-2 py-2 transition ${
                  mode === item.id ? "bg-gold text-ink font-semibold" : "border border-gold/30 text-gold"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
          />

          {mode !== "forgot" && (
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "reset" ? "New password" : "Password"}
              className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
            />
          )}

          {(mode === "signup" || mode === "reset") && (
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink disabled:opacity-60"
          >
            {loading ? "Processing..." : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Update Password"}
          </button>

          {(mode === "signin" || mode === "signup") && (
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="rounded-full border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold disabled:opacity-60"
            >
              Continue with Google
            </button>
          )}

          {message && <p className="text-sm text-sand/80">{message}</p>}
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
