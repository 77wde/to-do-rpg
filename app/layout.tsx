import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

// webpixel bitmap (Manuel Viergutz) — the app-wide pixel/bitmap typeface.
const webpixel = localFont({
  src: [
    { path: "./fonts/webpixel-bitmap-regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/webpixel-bitmap-medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/webpixel-bitmap-bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/webpixel-bitmap-black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-webpixel",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jb",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuestLog — 할 일을 퀘스트로",
  description:
    "산만하고 회피형인 사람들을 위한 RPG 기반 To-Do 리스트. 할 일을 완료하면 경험치와 골드를 얻어 레벨업하세요.",
};

export const viewport: Viewport = {
  themeColor: "#f7f7f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${jbMono.variable} ${webpixel.variable}`}
    >
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
