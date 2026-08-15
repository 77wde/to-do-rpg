import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { cn } from "@/lib/utils";

// webpixel bitmap (Manuel Viergutz) — the app-wide pixel/bitmap typeface.
// Inter and JetBrains Mono stay only as fallbacks for glyphs the bitmap font
// lacks; nothing should set --font-sans to a non-pixel face.
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
  title: "TO DO BUG RPG — Turn tasks into quests",
  description:
    "An RPG-based to-do list for easily distracted, avoidant minds. Complete tasks to earn XP and gold, and level up.",
};

export const viewport: Viewport = {
  themeColor: "#f7f7f4",
  width: "device-width",
  initialScale: 1,
  // Lets the shell paint under the notch so safe-area insets can handle it.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={cn(inter.variable, jbMono.variable, webpixel.variable)}
    >
      {/* The app is phone-only by design: the shell keeps a handset width on
          every screen, and the body around it reads as the device bezel. */}
      <body className="app-frame">
        <div className="app-shell">
          <StoreProvider>{children}</StoreProvider>
        </div>
      </body>
    </html>
  );
}
