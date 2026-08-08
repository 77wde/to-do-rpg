"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  MIN_PASSWORD_LENGTH,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/supabase/auth";
import PixelLogo from "@/components/PixelLogo";
import PixelButton from "@/components/PixelButton";

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
  const { state, resume, start } = useStore();

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

  function showError(message: string) {
    setError(message);
    setErrorSeq((n) => n + 1);
  }

  /** Nickname entry is a second step, shown only for a brand-new adventure. */
  const [askName, setAskName] = useState(false);
  const [nickname, setNickname] = useState("Hero");

  /** Shared by local play and a successful sign-in. */
  function enterGame() {
    if (state) {
      // saved adventure → resume it
      resume();
      router.push("/play");
      return;
    }
    // new adventure → ask for a nickname in-app.
    // Not window.prompt(): embedded webviews block it outright, and an OS
    // dialog breaks the retro look anyway.
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
    setBusy(false);

    if (result.error) {
      showError(friendlyError(result.error));
      // Preselect so a retry is just typing, no clearing first.
      passwordRef.current?.select();
      return;
    }
    if (result.needsEmailConfirmation) {
      setSentTo(email.trim());
      setPassword("");
      return;
    }
    enterGame();
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-pixel)",
    fontSize: 10,
    letterSpacing: 1,
    alignSelf: "flex-start",
  };
  const fieldStyle: React.CSSProperties = { width: 280 };

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        className="float-in"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}
      >
        <PixelLogo size={200} />

        {askName ? (
          /* ---- Nickname ---- */
          <form
            onSubmit={submitNickname}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}
          >
            <label htmlFor="nickname" style={{ ...labelStyle, alignSelf: "center", fontSize: 12 }}>
              ENTER YOUR NAME
            </label>
            <input
              id="nickname"
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              // matches the nickname length constraint on public.players
              maxLength={32}
              autoFocus
              style={{ ...fieldStyle, fontFamily: "var(--font-pixel)", textAlign: "center" }}
            />
            <PixelButton type="submit" disabled={!nickname.trim()}>
              Start
            </PixelButton>
          </form>
        ) : sentTo ? (
          /* ---- Check your inbox ---- */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              maxWidth: 340,
              textAlign: "center",
            }}
          >
            <p style={{ fontFamily: "var(--font-pixel)", fontSize: 12, letterSpacing: 1 }}>
              CHECK YOUR INBOX
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              We sent a confirmation link to <strong>{sentTo}</strong>. Open it to
              activate your account, then come back and log in.
            </p>
            <PixelButton
              onClick={() => {
                setSentTo(null);
                switchMode("signin");
              }}
            >
              Back to login
            </PixelButton>
          </div>
        ) : !isSupabaseConfigured ? (
          /* ---- Local-only play ---- */
          <PixelButton onClick={enterGame}>Login</PixelButton>
        ) : (
          /* ---- Email + password ---- */
          <form
            onSubmit={submitAuth}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
          >
            <div className="row" style={{ gap: 4 }}>
              <button
                type="button"
                className={`btn btn-sm ${mode === "signin" ? "btn-secondary" : "btn-ghost"}`}
                onClick={() => switchMode("signin")}
                aria-pressed={mode === "signin"}
              >
                Log in
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === "signup" ? "btn-secondary" : "btn-ghost"}`}
                onClick={() => switchMode("signup")}
                aria-pressed={mode === "signup"}
              >
                Sign up
              </button>
            </div>

            <label htmlFor="email" style={labelStyle}>
              EMAIL
            </label>
            <input
              id="email"
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={fieldStyle}
            />

            <label htmlFor="password" style={labelStyle}>
              PASSWORD
            </label>
            <input
              id="password"
              ref={passwordRef}
              className={`input${error ? " is-error" : ""}`}
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
              style={fieldStyle}
            />
            {mode === "signup" && !error && (
              <span className="caption" style={{ fontSize: 11 }}>
                At least {MIN_PASSWORD_LENGTH} characters
              </span>
            )}

            {/* Above the button, not below: the button is what the user just
                clicked, so anything under it can sit past the fold. */}
            {error && (
              <div
                key={errorSeq}
                className="error-plate shake"
                role="alert"
                aria-live="assertive"
              >
                <span className="mark" aria-hidden>
                  !
                </span>
                <span>{error}</span>
              </div>
            )}

            <PixelButton type="submit" disabled={busy}>
              {busy
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account"
                  : "Log in"}
            </PixelButton>
          </form>
        )}
      </div>
    </main>
  );
}
