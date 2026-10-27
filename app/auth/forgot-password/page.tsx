"use client";

// Forgot password: asks for the username or email and requests a password reset.
// Everything in this file belongs to this page only.
// The request itself is a placeholder (see requestReset below) until the real API is connected.

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

// Replace this with the real request. It must resolve once the request is accepted and throw if it could not be sent.
// Always answer the same way whether or not the account exists, so the page never reveals which usernames are real.
async function requestReset(identifier: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (!identifier) throw new Error("Missing username or email.");
}

// the route drawn on the left: one vehicle drives along it, a few stops sit on it
const ROUTE = "M60 700 C160 620 120 520 240 470 S420 430 400 330 S300 200 470 120";

const css = `
.login { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(360px, 520px); }
.login-art { position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; gap: 32px; padding: 40px; background: #0b1822; color: #e8eef3; }
.login-art > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.login-art > :not(svg) { position: relative; }
.login-brand { display: flex; align-items: center; gap: 12px; }
.login-brand b { display: block; font-size: 16px; line-height: 1.2; }
.login-brand span { display: block; font-size: 13px; opacity: .65; }
.login-copy h2 { margin: 0 0 12px; max-width: 16ch; font-size: clamp(28px, 3.2vw, 42px); line-height: 1.12; }
.login-copy p { margin: 0; max-width: 40ch; line-height: 1.5; opacity: .75; }
.login-legend { display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 13px; opacity: .85; }
.login-legend i { display: inline-block; width: 9px; height: 9px; margin-right: 7px; border-radius: 50%; background: var(--c); }
.login-side { display: flex; align-items: center; justify-content: center; padding: 32px 24px; }
.login-card { width: 100%; max-width: 380px; }
.login-card h1 { margin: 0 0 6px; font-size: 26px; }
.login-card .lead { margin: 0 0 24px; opacity: .7; line-height: 1.5; }
.login-form { display: grid; gap: 16px; }
.login-link { color: inherit; font-size: 14px; text-decoration: underline; opacity: .8; }
.login-link:hover { opacity: 1; }
.login-linkbtn { border: 0; background: none; padding: 0; font: inherit; font-size: 14px; color: inherit; text-decoration: underline; opacity: .8; cursor: pointer; }
.login-linkbtn:hover { opacity: 1; }
.login-error { margin: 0; padding: 10px 12px; border: 1px solid var(--stopped, #e5534b); border-radius: 6px; color: var(--stopped, #e5534b); font-size: 14px; }
.login-submit { width: 100%; justify-content: center; }
a.login-submit { display: inline-flex; align-items: center; text-decoration: none; }
.login-actions { display: grid; gap: 16px; justify-items: center; }
.login-sent { margin: 0 0 24px; padding: 12px 14px; border: 1px solid var(--line, rgba(128,128,128,.35)); border-radius: 6px; line-height: 1.5; word-break: break-word; }
.login-mobile-brand { display: none; align-items: center; gap: 10px; margin-bottom: 28px; font-weight: 600; }
@media (max-width: 900px) {
  .login { grid-template-columns: 1fr; }
  .login-art { display: none; }
  .login-mobile-brand { display: flex; }
}
`;

function Mark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="#13303f" />
      <path d="M18 6.5a7.5 7.5 0 0 0-7.5 7.5c0 5.6 7.5 15 7.5 15s7.5-9.4 7.5-15A7.5 7.5 0 0 0 18 6.5Z" fill="var(--moving, #35c46a)" />
      <circle cx="18" cy="14" r="2.8" fill="#13303f" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [sentTo, setSentTo] = useState(""); // set once the request was sent, shows the confirmation
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const artRef = useRef<SVGSVGElement>(null);

  // keep the map still for people who asked their system for less motion
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) artRef.current?.pauseAnimations();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = identifier.trim();
    if (!value) return setError("Enter your username or email.");

    setError("");
    setLoading(true);
    try {
      await requestReset(value);
      setSentTo(value);
    } catch {
      setError("Could not send the request. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function tryAnother() {
    setSentTo("");
    setIdentifier("");
    setError("");
  }

  return (
    <main className="login">
      <style>{css}</style>

      <aside className="login-art" aria-hidden="true">
        <svg ref={artRef} viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="800" stroke="#fff" strokeOpacity=".05" />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 60} x2="600" y2={i * 60} stroke="#fff" strokeOpacity=".05" />
          ))}
          <path d="M0 560 C150 520 300 600 600 480" fill="none" stroke="#fff" strokeOpacity=".09" strokeWidth="6" />
          <path d="M180 0 C220 200 120 400 200 800" fill="none" stroke="#fff" strokeOpacity=".09" strokeWidth="6" />
          <path d="M600 260 C440 300 380 200 0 300" fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="4" />

          <path d={ROUTE} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 9" style={{ stroke: "var(--moving, #35c46a)" }} />
          {[[60, 700], [240, 470], [400, 330], [470, 120]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#0b1822" strokeWidth="2" style={{ stroke: "var(--moving, #35c46a)" }} />
          ))}

          <circle cx="140" cy="230" r="6" style={{ fill: "var(--stopped, #e5534b)" }} />
          <circle cx="500" cy="610" r="6" style={{ fill: "var(--offline, #6b7785)" }} />

          <g>
            <circle r="10" style={{ fill: "var(--moving, #35c46a)" }}>
              <animate attributeName="r" values="8;22;8" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".45;0;.45" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle r="7" strokeWidth="2.5" stroke="#0b1822" style={{ fill: "var(--moving, #35c46a)" }} />
            <animateMotion dur="18s" repeatCount="indefinite" path={ROUTE} />
          </g>
        </svg>

        <div className="login-brand">
          <Mark />
          <div>
            <b>Vehicle Tracking</b>
            <span>Management System</span>
          </div>
        </div>

        <div className="login-copy">
          <h2>Back to your fleet in a minute.</h2>
          <p>Reset your password and carry on monitoring your vehicles, assets and customers.</p>
        </div>

        <div className="login-legend">
          <span style={{ ["--c" as string]: "var(--moving, #35c46a)" } as CSSProperties}>
            <i />
            Moving
          </span>
          <span style={{ ["--c" as string]: "var(--stopped, #e5534b)" } as CSSProperties}>
            <i />
            Stopped
          </span>
          <span style={{ ["--c" as string]: "var(--offline, #6b7785)" } as CSSProperties}>
            <i />
            Offline
          </span>
        </div>
      </aside>

      <div className="login-side">
        <div className="login-card">
          <div className="login-mobile-brand">
            <Mark size={32} />
            Vehicle Tracking Management System
          </div>

          {sentTo ? (
            <>
              <h1>Check your email</h1>
              <p className="lead">If an account matches the details below, we have sent instructions to reset its password. Check your spam folder too.</p>
              <p className="login-sent" role="status">
                {sentTo}
              </p>
              <div className="login-actions">
                <Link href="/auth/login" className="btn primary login-submit">
                  Back to sign in
                </Link>
                <button type="button" className="login-linkbtn" onClick={tryAnother}>
                  Use a different username or email
                </button>
              </div>
            </>
          ) : (
            <>
              <h1>Forgot password?</h1>
              <p className="lead">Enter your username or email and we will send you instructions to reset your password.</p>

              <form className="login-form" onSubmit={submit} noValidate>
                <div className="field">
                  <label htmlFor="identifier">Username or email</label>
                  <input
                    id="identifier"
                    name="identifier"
                    autoComplete="username"
                    autoFocus
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError("");
                    }}
                  />
                </div>

                {error && (
                  <p className="login-error" role="alert">
                    {error}
                  </p>
                )}

                <button className="btn primary login-submit" type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>

                <div className="login-actions">
                  <Link href="/auth/login" className="login-link">
                    Back to sign in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}