"use client";
import { useStore } from "@/lib/store";

export default function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toast-wrap" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          <span className="glyph" aria-hidden>
            {t.glyph}
          </span>
          <span>{t.text}</span>
        </div>
      ))}
      <style jsx>{`
        .toast-wrap {
          position: fixed;
          left: 50%;
          bottom: 28px;
          transform: translateX(-50%);
          z-index: 60;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          pointer-events: none;
        }
        .toast {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--ink);
          color: var(--canvas);
          padding: 10px 18px;
          border-radius: var(--r-pill);
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
          animation: pop 0.24s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .toast .glyph {
          font-size: 18px;
        }
        .toast-reward {
          background: var(--ink);
        }
        .toast-level {
          background: var(--primary);
          color: var(--on-primary);
        }
        .toast-bad {
          background: var(--error);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
