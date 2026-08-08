"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  MIN_PASSWORD_LENGTH,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/supabase/auth";
import PixelLogo from "@/components/PixelLogo";
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

export default function StartPage() {
  const router = useRouter();
  const { state, ready, loggedIn, needsNickname, loadFailed, retryLoad, resume, start } =
    useStore();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Bumped on every failure so the banner remounts. Without it, failing twice
   * with the same message would not replay the shake — the element never
   * changed, so React keeps it and the animation does not restart.
   */
  const [errorSeq, setErrorSeq] = useState(0);
  /** Set after sign-up when the account still needs the emailed link. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  /** Nickname entry is a second step, shown only for a brand-new adventure. */
  const [askName, setAskName] = useState(false);
  const [nickname, setNickname] = useState("Hero");

  function showError(message: string) {
    setError(message);
    setErrorSeq((n) => n + 1);
  }

  /**
   * Cloud mode: signing in only starts the work. The store then loads the
   * save asynchronously, so routing waits on its result rather than on the
   * sign-in call returning.
   */
  useEffect(() => {
    if (!isSupabaseConfigured || !ready) return;
    if (loadFailed) {
      // Sign-in worked but the save could not be fetched. Drop out of the
      // pending state so the screen offers a retry instead of hanging.
      setBusy(false);
      return;
    }
    if (needsNickname) {
      setAskName(true);
      return;
    }
    if (loggedIn) router.push("/play");
  }, [ready, needsNickname, loggedIn, loadFailed, router]);

  /** Local mode only — cloud sign-in is routed by the effect above. */
  function enterGame() {
    if (state) {
      resume();
      router.push("/play");
      return;
    }
    // Ask for a nickname in-app. Not window.prompt(): embedded webviews block
    // it outright, and an OS dialog breaks the retro look anyway.
    setAskName(true);
  }

  function submitNickname(e: React.FormEvent) {
    e.preventDefault();
    const name = nickname.trim();
    if (!name) return;
    start(name);
    router.push("/play");
  }

  async function submitAuth(e: React.FormEvent) {
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
      setSentTo(email.trim());
      setPassword("");
      return;
    }
    // Signed in. Stay busy — the store is still loading the save, and the
    // effect above routes once it knows whether a nickname is needed.
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  const errorBanner = error && (
    <div
      key={errorSeq}
      className="error-plate shake w-full"
      role="alert"
      aria-live="assertive"
    >
      <span className="mark" aria-hidden>
        !
      </span>
      <span>{error}</span>
    </div>
  );

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-5 py-10">
      <div className="float-in flex w-full flex-col items-center gap-8">
        <PixelLogo size={180} />

        {askName ? (
          /* ---- Nickname ---- */
          <form onSubmit={submitNickname} className="flex w-full flex-col items-center gap-5">
            <Label htmlFor="nickname" className="font-pixel text-xs tracking-widest">
              ENTER YOUR NAME
            </Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              // matches the nickname length constraint on public.players
              maxLength={32}
              autoFocus
              className="text-center"
            />
            <Button type="submit" size="lg" disabled={!nickname.trim()} className="w-full">
              Start
            </Button>
          </form>
        ) : loadFailed ? (
          /* ---- Signed in, but the save would not load ---- */
          <div className="flex w-full flex-col items-center gap-5 text-center">
            <p className="font-pixel text-xs tracking-widest">COULD NOT LOAD</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You&apos;re signed in, but your save didn&apos;t come through. This
              usually clears up on a retry.
            </p>
            <Button size="lg" className="w-full" onClick={retryLoad}>
              Try again
            </Button>
          </div>
        ) : sentTo ? (
          /* ---- Check your inbox ---- */
          <div className="flex w-full flex-col items-center gap-5 text-center">
            <p className="font-pixel text-xs tracking-widest">CHECK YOUR INBOX</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We sent a confirmation link to{" "}
              <strong className="text-foreground">{sentTo}</strong>. Open it to
              activate your account, then come back and log in.
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setSentTo(null);
                switchMode("signin");
              }}
            >
              Back to login
            </Button>
          </div>
        ) : !isSupabaseConfigured ? (
          /* ---- Local-only play ---- */
          <Button size="lg" className="w-full" onClick={enterGame}>
            Login
          </Button>
        ) : (
          /* ---- Email + password ---- */
          <form onSubmit={submitAuth} className="flex w-full flex-col gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "signin" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => switchMode("signin")}
                aria-pressed={mode === "signin"}
              >
                Log in
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => switchMode("signup")}
                aria-pressed={mode === "signup"}
              >
                Sign up
              </Button>
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
                {/* Sits on the label row so the hint never pushes the submit
                    button down when it appears. */}
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

            {/* Above the button, not below: the button is what the user just
                tapped, so anything under it can sit past the fold. */}
            {errorBanner}

            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account"
                  : "Log in"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
