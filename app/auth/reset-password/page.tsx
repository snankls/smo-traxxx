"use client";

// Reset password: opened from the link in the reset email (/reset-password?token=...).
// The person types a new password twice; the token from the link says which account it is for.
// If the page is opened without a token, a "Reset code" field is shown so the code from the email can be typed in.
// Everything in this file belongs to this page only.
// The request itself is a placeholder (see resetPassword below) until the real API is connected.

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

const LOGIN_PAGE = "/login"; // the sign in page
const FORGOT_PAGE = "/forgot-password"; // where a new reset link is requested

// Replace this with the real request. It must resolve when the password was changed and throw with a
// readable message when it was not (for example when the link has expired).
async function resetPassword(token: string, password: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (!token || !password) throw new Error("This reset link is invalid or has expired.");
}

// what a new password must contain; each rule is shown as a live checklist
const rules: { label: string; ok: (p: string) => boolean }[] = [
  { label: "At least 8 characters", ok: (p) => p.length >= 8 },
  { label: "Upper and lower case letters", ok: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "At least one number", ok: (p) => /\d/.test(p) },
];

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
.login-pass { position: relative; }
.login-pass input { padding-right: 64px; }
.login-toggle { position: absolute; top: 50%; right: 8px; transform: translateY(-50%); border: 0; background: none; padding: 4px 8px; font: inherit; font-size: 13px; color: inherit; opacity: .7; cursor: pointer; }
.login-toggle:hover { opacity: 1; }
.login-note { margin: 6px 0 0; font-size: 12px; color: var(--stopped, #e5534b); }
.login-rules { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: 13px; }
.login-rules li { display: flex; gap: 8px; opacity: .7; }
.login-rules li.ok { opacity: 1; color: var(--moving, #35c46a); }
.login-link { color: inherit; font-size: 14px; text-decoration: underline; opacity: .8; }
.login-link:hover { opacity: 1; }
.login-error { margin: 0; padding: 10px 12px; border: 1px solid var(--stopped, #e5534b); border-radius: 6px; color: var(--stopped, #e5534b); font-size: 14px; }
.login-submit { width: 100%; justify-content: center; }
a.login-submit { display: inline-flex; align-items: center; text-decoration: none; }
.login-actions { display: grid; gap: 16px; justify-items: center; }
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

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | undefined>(undefined); // undefined = not read yet, "" = link has no token
  const [code, setCode] = useState(""); // typed in by hand when the link had no token
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const artRef = useRef<SVGSVGElement>(null);

  // read the token from the link
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  // keep the map still for people who asked their system for less motion
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) artRef.current?.pauseAnimations();
  }, []);

  const needsCode = token === "";
  const rulesMet = rules.every((r) => r.ok(password));
  const mismatch = confirm !== "" && confirm !== password;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const usedToken = token || code.trim();
    if (!usedToken) return setError("Enter the reset code from your email.");
    if (!rulesMet) return setError("The new password does not meet the requirements.");
    if (password !== confirm) return setError("The two passwords do not match.");

    setError("");
    setLoading(true);
    try {
      await resetPassword(usedToken, password);
      setCode("");
      setPassword("");
      setConfirm("");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const toggle = (
    <button type="button" className="login-toggle" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
      {showPassword ? "Hide" : "Show"}
    </button>
  );

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
          <h2>Choose a new password.</h2>
          <p>Pick one you do not use anywhere else. You will use it the next time you sign in.</p>
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

          {token === undefined ? null : done ? (
            <>
              <h1>Password updated</h1>
              <p className="lead">Your password has been changed. Sign in with your new password.</p>
              <Link href={LOGIN_PAGE} className="btn primary login-submit">
                Sign in
              </Link>
            </>
          ) : (
            <>
              <h1>Reset password</h1>
              <p className="lead">
                {needsCode
                  ? "Enter the reset code from your email and choose a new password."
                  : "Enter your new password twice to make sure it is typed correctly."}
              </p>

              <form className="login-form" onSubmit={submit} noValidate>
                {needsCode && (
                  <div className="field">
                    <label htmlFor="code">Reset code</label>
                    <input
                      id="code"
                      name="code"
                      autoComplete="one-time-code"
                      autoFocus
                      required
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setError("");
                      }}
                    />
                  </div>
                )}

                <div className="field">
                  <label htmlFor="password">New password</label>
                  <div className="login-pass">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      autoFocus={!needsCode}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      onKeyUp={(e) => setCapsOn(e.getModifierState("CapsLock"))}
                      onBlur={() => setCapsOn(false)}
                    />
                    {toggle}
                  </div>
                  {capsOn && <p className="login-note">Caps Lock is on.</p>}
                </div>

                <ul className="login-rules" aria-label="Password requirements">
                  {rules.map((r) => (
                    <li key={r.label} className={r.ok(password) ? "ok" : undefined}>
                      <span aria-hidden="true">{r.ok(password) ? "✓" : "•"}</span>
                      {r.label}
                    </li>
                  ))}
                </ul>

                <div className="field">
                  <label htmlFor="confirm">Confirm new password</label>
                  <div className="login-pass">
                    <input
                      id="confirm"
                      name="confirm"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      aria-invalid={mismatch}
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        setError("");
                      }}
                    />
                    {toggle}
                  </div>
                  {mismatch && <p className="login-note">The two passwords do not match.</p>}
                </div>

                {error && (
                  <p className="login-error" role="alert">
                    {error}
                  </p>
                )}

                <button className="btn primary login-submit" type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Change password"}
                </button>

                <div className="login-actions">
                  {needsCode && (
                    <Link href={FORGOT_PAGE} className="login-link">
                      Did not get a code? Request a new link
                    </Link>
                  )}
                  <Link href={LOGIN_PAGE} className="login-link">
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