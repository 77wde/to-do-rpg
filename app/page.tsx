"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import AuthForm from "@/components/AuthForm";
import PixelLogo from "@/components/PixelLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The start screen. One of five states shows at a time: nickname entry, a
 * failed load, the "check your inbox" notice, the local-only play button, or
 * the email/password form.
 */
export default function StartPage() {
  const router = useRouter();
  const { state, ready, loggedIn, needsNickname, loadFailed, retryLoad, resume, start } =
    useStore();

  const [busy, setBusy] = useState(false);
  /** A mail is out and the user has to go read it — sign-up or password reset. */
  const [sent, setSent] = useState<{ kind: "confirm" | "reset"; email: string } | null>(
    null,
  );
  /** Kept past `sentTo` so returning to the form does not blank the address. */
  const [lastEmail, setLastEmail] = useState("");
  /** Nickname entry is a second step, shown only for a brand-new adventure. */
  const [askName, setAskName] = useState(false);
  const [nickname, setNickname] = useState("Hero");

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

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-5 py-10">
      <div className="float-in flex w-full flex-col items-center gap-8">
        <PixelLogo size={180} />

        {askName ? (
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
          <Notice
            title="COULD NOT LOAD"
            action="Try again"
            onAction={retryLoad}
          >
            You&apos;re signed in, but your save didn&apos;t come through. This usually
            clears up on a retry.
          </Notice>
        ) : sent ? (
          <Notice
            title="CHECK YOUR INBOX"
            action="Back to login"
            onAction={() => setSent(null)}
          >
            {sent.kind === "confirm" ? (
              <>
                We sent a confirmation link to{" "}
                <strong className="text-foreground">{sent.email}</strong>. Open it to
                activate your account, then come back and log in.
              </>
            ) : (
              <>
                If <strong className="text-foreground">{sent.email}</strong> has an
                account, a reset link is on its way. Open it to choose a new password.
              </>
            )}
          </Notice>
        ) : !isSupabaseConfigured ? (
          <Button size="lg" className="w-full" onClick={enterGame}>
            Login
          </Button>
        ) : (
          <AuthForm
            busy={busy}
            setBusy={setBusy}
            initialEmail={lastEmail}
            onEmailConfirmationSent={(email) => {
              setLastEmail(email);
              setSent({ kind: "confirm", email });
            }}
            onResetLinkSent={(email) => {
              setLastEmail(email);
              setSent({ kind: "reset", email });
            }}
          />
        )}
      </div>
    </main>
  );
}

/** A dead-end state: a headline, an explanation, and the one way forward. */
function Notice({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <p className="font-pixel text-xs tracking-widest">{title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
      <Button size="lg" className="w-full" onClick={onAction}>
        {action}
      </Button>
    </div>
  );
}
