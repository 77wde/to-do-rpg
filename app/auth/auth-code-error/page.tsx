import Link from "next/link";

export default function AuthCodeErrorPage() {
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
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 20 }}>Login failed</h1>
        <p style={{ maxWidth: 420, lineHeight: 1.7 }}>
          The sign-in link could not be verified. It may have already been used
          or expired. Please try again.
        </p>
        <Link className="btn btn-secondary" href="/">
          Back to start
        </Link>
      </div>
    </main>
  );
}
