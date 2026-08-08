"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import PixelLogo from "@/components/PixelLogo";
import PixelButton from "@/components/PixelButton";

export default function StartPage() {
  const router = useRouter();
  const { state, resume, start } = useStore();

  function login() {
    if (state) {
      // saved adventure → resume it
      resume();
    } else {
      // new adventure → ask for a nickname (minimal splash, no form)
      const name = (window.prompt("닉네임을 입력하세요", "용사") || "").trim();
      if (!name) return;
      start(name);
    }
    router.push("/play");
  }

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
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}
      >
        <PixelLogo size={200} />
        <PixelButton onClick={login}>Login</PixelButton>
      </div>
    </main>
  );
}
