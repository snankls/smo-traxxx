"use client";

// Login: username + password sign in for the Vehicle Tracking Management System.
// Everything in this file belongs to this page only.
// The sign-in itself is a placeholder (see signIn below) until the real API is connected.

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const APP_HOME = "/"; // where to go after a successful sign in
const REMEMBER_KEY = "vtms.username";

// Replace this with the real login request. It must resolve on success and throw on a wrong username / password.
// For now it accepts any non-empty username and password.
async function signIn(username: string, password: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (!username || !password) throw new Error("Invalid username or password.");
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
.login-pass { position: relative; }
.login-pass input { padding-right: 64px; }
.login-toggle { position: absolute; top: 50%; right: 8px; transform: translateY(-50%); border: 0; background: none; padding: 4px 8px; font: inherit; font-size: 13px; color: inherit; opacity: .7; cursor: pointer; }
.login-toggle:hover { opacity: 1; }
.login-note { margin: 6px 0 0; font-size: 12px; color: var(--stopped, #e5534b); }
.login-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.login-link { color: inherit; font-size: 14px; text-decoration: underline; opacity: .8; }
.login-link:hover { opacity: 1; }
.login-remember { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.login-remember input { width: 18px; height: 18px; margin: 0; padding: 0; }
.login-error { margin: 0; padding: 10px 12px; border: 1px solid var(--stopped, #e5534b); border-radius: 6px; color: var(--stopped, #e5534b); font-size: 14px; }
.login-submit { width: 100%; justify-content: center; }
.login-foot { margin: 22px 0 0; font-size: 13px; opacity: .65; }
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

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const artRef = useRef<SVGSVGElement>(null);

  // pre-fill the username saved by "Remember me"
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setUsername(saved);
        setRemember(true);
      }
    } catch {
      /* storage not available, ignore */
    }
  }, []);

  // keep the map still for people who asked their system for less motion
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) artRef.current?.pauseAnimations();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const user = username.trim();
    if (!user || !password) return setError("Enter your username and password.");

    setError("");
    setLoading(true);
    try {
      await signIn(user, password);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, user);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* storage not available, ignore */
      }
      router.push(APP_HOME);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in. Try again.");
      setLoading(false);
    }
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
          <h2>Know where every vehicle is.</h2>
          <p>Monitor your fleet live, manage assets and customers, and review trip history from one place.</p>
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

          <h1>Sign in</h1>
          <p className="lead">Enter your username and password to open the dashboard.</p>

          <form className="login-form" onSubmit={submit} autoComplete="on" noValidate>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="login-pass">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyUp={(e) => setCapsOn(e.getModifierState("CapsLock"))}
                  onBlur={() => setCapsOn(false)}
                />
                <button type="button" className="login-toggle" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {capsOn && <p className="login-note">Caps Lock is on.</p>}
            </div>

            <div className="login-row">
              <label className="login-remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <Link href="/auth/forgot-password" className="login-link">
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button className="btn primary login-submit" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="login-foot">Need an account? Contact your administrator.</p>
        </div>
      </div>
    </main>
  );
}