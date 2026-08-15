"use client";
import { useRef, useState } from "react";
import {
  MIN_PASSWORD_LENGTH,
  sendPasswordReset,
  signInWithEmail,
  signInWithGitHub,
  signUpWithEmail,
} from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** lucide-react dropped its brand icons, so the mark is inlined. */
function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/** "reset" asks for the address only and mails a recovery link. */
type Mode = "signin" | "signup" | "reset";

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
    // Deliberately not "too many attempts": the cap is on mail the project can
    // send per hour, so it fires even on a first try and blaming the user for
    // retrying sends them off to keep pressing the button.
    return "Our mail system is having trouble right now. Please try again in an hour.";
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
  initialEmail = "",
  onEmailConfirmationSent,
  onResetLinkSent,
}: {
  /** True while the store is still loading the save after a successful sign-in. */
  busy: boolean;
  setBusy: (v: boolean) => void;
  /**
   * Prefill. The form unmounts while the "check your inbox" notice is up, so
   * without this, coming back from it would blank the address just typed.
   */
  initialEmail?: string;
  onEmailConfirmationSent: (email: string) => void;
  /** The recovery mail is on its way; the caller shows the notice. */
  onResetLinkSent: (email: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(initialEmail);
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

  async function startGitHub() {
    setError(null);
    setBusy(true);
    const result = await signInWithGitHub();
    // Success never gets here — the browser has already left for GitHub.
    if (result.error) {
      setBusy(false);
      showError(friendlyError(result.error));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "reset") {
      setBusy(true);
      const result = await sendPasswordReset(email.trim());
      setBusy(false);
      if (result.error) {
        showError(friendlyError(result.error));
        return;
      }
      onResetLinkSent(email.trim());
      return;
    }

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
      {/* Recovery is a detour, not a third tab: showing the pair with neither
          one selected reads as a broken toggle. */}
      {mode === "reset" ? (
        <p className="font-pixel text-center text-xs tracking-widest">RESET PASSWORD</p>
      ) : (
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
      )}

      {/* GitHub first: it is one tap versus two fields, and it sidesteps the
          password entirely. Hidden during recovery, which is about a password
          this account may not even have. */}
      {mode !== "reset" && (
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={startGitHub}
          >
            <GitHubMark />
            Continue with GitHub
          </Button>
          <div className="flex items-center gap-3" aria-hidden>
            <span className="h-[3px] flex-1 bg-foreground" />
            <span className="font-pixel text-[9px] tracking-widest text-muted-foreground">
              OR
            </span>
            <span className="h-[3px] flex-1 bg-foreground" />
          </div>
        </>
      )}

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

      {/* Recovery only needs the address — there is no password to give yet. */}
      {mode !== "reset" && (
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
            {mode === "signin" && (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-auto px-0"
                onClick={() => switchMode("reset")}
              >
                Forgot?
              </Button>
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
      )}

      {mode === "reset" && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          We&apos;ll email you a link that lets you set a new password.
        </p>
      )}

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
        {busy
          ? "Please wait..."
          : mode === "signup"
            ? "Create account"
            : mode === "reset"
              ? "Send reset link"
              : "Log in"}
      </Button>

      {mode === "reset" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => switchMode("signin")}
        >
          Back to log in
        </Button>
      )}
    </form>
  );
}
