"use client";
// ============================================================================
// PixelButton — chunky 8-bit button: pastel-green face, black outline, hard
// pixel drop-shadow, pixel font. Presses down on :active.
// ============================================================================
import React from "react";

export default function PixelButton({
  children,
  onClick,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button type={type} onClick={onClick} className={`pixel-btn ${className ?? ""}`}>
      <span>{children}</span>
      <style jsx>{`
        .pixel-btn {
          --face: #a6e59a; /* pastel green */
          --face-lite: #c2f0b8;
          --edge: #000000; /* black outline */
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-pixel);
          font-size: 14px;
          line-height: 1;
          text-transform: uppercase;
          color: var(--edge);
          background: var(--face);
          border: 4px solid var(--edge);
          border-radius: 0;
          padding: 16px 24px;
          box-shadow: 6px 6px 0 0 var(--edge);
          image-rendering: pixelated;
          transition: transform 0.04s steps(1), box-shadow 0.04s steps(1), background 0.08s;
          cursor: pointer;
        }
        .pixel-btn:hover {
          background: var(--face-lite);
        }
        .pixel-btn:active {
          transform: translate(6px, 6px);
          box-shadow: 0 0 0 0 var(--edge);
        }
        .pixel-btn:focus-visible {
          outline: 3px dashed var(--edge);
          outline-offset: 4px;
        }
        .pixel-btn span {
          display: inline-block;
          letter-spacing: 1px;
        }
      `}</style>
    </button>
  );
}
