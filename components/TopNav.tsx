"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/pages";
import { useFleet } from "@/lib/store";

export default function TopNav() {
  const path = usePathname();
  const vehicles = useFleet((s) => s.vehicles);
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const [burger, setBurger] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        d.toLocaleDateString([], { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString([], { hour12: false }),
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // close menus after navigating
  useEffect(() => {
    setOpenGroup(null);
    setBurger(false);
  }, [path]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".nav-item")) setOpenGroup(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenGroup(null);
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const online = vehicles.filter((v) => v.status !== "offline").length;
  const alarms = vehicles.filter((v) => v.status === "stopped").length;

  return (
    <header className={`topbar${burger ? " open" : ""}`}>
      <Link href="/" className="brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        Fleet Tracker
      </Link>

      <button className="burger" type="button" aria-label="Open menu" aria-expanded={burger} onClick={() => setBurger((b) => !b)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <nav className="nav" aria-label="Main menu">
        {NAV.map((g, gi) => {
          if (g.href) {
            return (
              <div className="nav-item" key={g.label}>
                <Link href={g.href} className={`nav-btn${path === g.href ? " on" : ""}`}>
                  {g.label}
                </Link>
              </div>
            );
          }
          const active = g.items?.some((i) => i.href === path);
          const open = openGroup === gi;
          return (
            <div className="nav-item" key={g.label}>
              <button
                type="button"
                className={`nav-btn${active ? " on" : ""}`}
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => setOpenGroup(open ? null : gi)}
              >
                {g.label}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="menu" hidden={!open}>
                {g.items?.map((it) => (
                  <Link key={it.href} href={it.href} className={path === it.href ? "on" : ""}>
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="top-stats">
        <span className="hide-sm">Units <b>{vehicles.length}</b></span>
        <span className="hide-sm">Online <b>{online}</b></span>
        <span className="alarm" title="Open alarms">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          <b>{alarms}</b>
        </span>
        <span className="clock">{clock}</span>
      </div>
    </header>
  );
}
