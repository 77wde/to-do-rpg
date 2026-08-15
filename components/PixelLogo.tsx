// ============================================================================
// PixelLogo — renders the original pixel-art badge PNG (public/pixel-logo.png,
// 48×48). `imageRendering: "pixelated"` keeps the pixels crisp when scaled up.
// ============================================================================
/* eslint-disable @next/next/no-img-element */

export default function PixelLogo({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/pixel-logo.png"
      width={size}
      height={size}
      alt="TO DO BUG RPG 로고"
      className={className}
      style={{ imageRendering: "pixelated", display: "block" }}
      draggable={false}
    />
  );
}
