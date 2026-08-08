"use client";
import { useRef, useState } from "react";
import {
  MIN_PASSWORD_LENGTH,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup";

/**
 * Supabase messages are terse and developer-facing. Rewrite the ones players
 * will actually hit; pass anything else through so real faults stay visible.
 */
function friendlyError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "That email and password don't match an account.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox for the link.";
  }
  if (m.includes("email rate limit") || m.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return raw;
}

/**
 * Email + password entry. Signing in does not finish the job — the store then
 * loads the save — so the caller owns the routing and only hears about the two
 * outcomes it has to render itself.
 */
export default function AuthForm({
  busy,
  setBusy,
  onEmailConfirmationSent,
}: {
  /** True while the store is still loading the save after a successful sign-in. */
  busy: boolean;
  setBusy: (v: boolean) => void;
  onEmailConfirmationSent: (email: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  /**
   * Bumped on every failure so the banner remounts. Without it, failing twice
   * with the same message would not replay the shake — the element never
   * changed, so React keeps it and the animation does not restart.
   */
  const [errorSeq, setErrorSeq] = useState(0);
  const passwordRef = useRef<HTMLInputElement>(null);

  function showError(message: string) {
    setError(message);
    setErrorSeq((n) => n + 1);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      showError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      passwordRef.current?.focus();
      return;
    }

    setBusy(true);
    const result =
      mode === "signup"
        ? await signUpWithEmail(email.trim(), password)
        : await signInWithEmail(email.trim(), password);

    if (result.error) {
      setBusy(false);
      showError(friendlyError(result.error));
      // Preselect so a retry is just typing, no clearing first.
      passwordRef.current?.select();
      return;
    }
    if (result.needsEmailConfirmation) {
      setBusy(false);
      setPassword("");
      onEmailConfirmationSent(email.trim());
      return;
    }
    // Signed in. Stay busy — the store is still loading the save, and the
    // caller routes once it knows whether a nickname is needed.
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4">
      <div className="flex gap-2">
        {(["signin", "signup"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            variant={mode === m ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => switchMode(m)}
            aria-pressed={mode === m}
          >
            {m === "signin" ? "Log in" : "Sign up"}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="font-pixel text-[10px] tracking-widest">
          EMAIL
        </Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="password" className="font-pixel text-[10px] tracking-widest">
            PASSWORD
          </Label>
          {/* Sits on the label row so the hint never pushes the submit button
              down when it appears. */}
          {mode === "signup" && !error && (
            <span className="text-[10px] text-muted-foreground">
              At least {MIN_PASSWORD_LENGTH} characters
            </span>
          )}
        </div>
        <Input
          id="password"
          ref={passwordRef}
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          aria-invalid={error ? true : undefined}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            // Typing means they've seen it — clear the flagged state.
            if (error) setError(null);
          }}
        />
      </div>

      {/* Above the button, not below: the button is what the user just tapped,
          so anything under it can sit past the fold. */}
      {error && (
        <div key={errorSeq} className="error-plate shake w-full" role="alert" aria-live="assertive">
          <span className="mark" aria-hidden>
            !
          </span>
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" size="lg" disabled={busy} className="w-full">
        {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
      </Button>
    </form>
  );
}
