"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MIN_PASSWORD_LENGTH,
  checkSession,
  updatePassword,
  type SessionCheck,
} from "@/lib/supabase/auth";
import PixelLogo from "@/components/PixelLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Where the recovery link lands. /auth/confirm has already turned the token
 * into a session by the time this renders, so setting the password is just an
 * update on the signed-in user.
 */
export default function NewPasswordPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionCheck | null>(null);
  /** Bumping this re-runs the session check. */
  const [checkAttempt, setCheckAttempt] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Remounts the banner so the shake replays on a repeated message. */
  const [errorSeq, setErrorSeq] = useState(0);

  // No session means the link was never opened, or it has already expired —
  // either way there is nothing to update, so say so instead of failing later.
  // A failed check is kept separate: that one is worth retrying.
  useEffect(() => {
    let alive = true;
    setSession(null);
    checkSession().then((result) => {
      if (alive) setSession(result);
    });
    return () => {
      alive = false;
    };
  }, [checkAttempt]);

  function showError(message: string) {
    setError(message);
    setErrorSeq((n) => n + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      showError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      showError("The two passwords don't match.");
      return;
    }

    setBusy(true);
    const result = await updatePassword(password);
    if (result.error) {
      setBusy(false);
      showError(result.error);
      return;
    }
    // The recovery session is a real session, so there is nothing left to log
    // into — go straight to the game.
    router.push("/play");
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-5 py-10">
      <div className="float-in flex w-full flex-col items-center gap-8">
        <PixelLogo size={180} />

        {!session ? (
          <p className="text-sm text-muted-foreground">Checking your link…</p>
        ) : session.status === "unknown" ? (
          <div className="flex w-full flex-col items-center gap-5 text-center">
            <p className="font-pixel text-xs tracking-widest">COULD NOT CHECK</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We couldn&apos;t reach the server to check your link. Your link is
              probably still fine — try again.
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => setCheckAttempt((n) => n + 1)}
            >
              Try again
            </Button>
          </div>
        ) : session.status === "signed-out" ? (
          <div className="flex w-full flex-col items-center gap-5 text-center">
            <p className="font-pixel text-xs tracking-widest">LINK EXPIRED</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This reset link is no longer valid. Ask for a new one from the login
              screen.
            </p>
            <Button size="lg" className="w-full" onClick={() => router.push("/")}>
              Back to login
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex w-full flex-col gap-4">
            <p className="font-pixel text-center text-xs tracking-widest">
              NEW PASSWORD
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label
                  htmlFor="new-password"
                  className="font-pixel text-[10px] tracking-widest"
                >
                  PASSWORD
                </Label>
                {!error && (
                  <span className="text-[10px] text-muted-foreground">
                    At least {MIN_PASSWORD_LENGTH} characters
                  </span>
                )}
              </div>
              <Input
                id="new-password"
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                autoFocus
                aria-invalid={error ? true : undefined}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="confirm-password"
                className="font-pixel text-[10px] tracking-widest"
              >
                CONFIRM
              </Label>
              <Input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                aria-invalid={error ? true : undefined}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>

            {error && (
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
            )}

            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy ? "Please wait..." : "Set password"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
