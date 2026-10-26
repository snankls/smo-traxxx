"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { STATUS_COLOR } from "@/lib/data";
import { useFleet } from "@/lib/store";
import DetailPanel from "./DetailPanel";
import VehicleDock from "./VehicleDock";
import VehicleList from "./VehicleList";

// Leaflet touches `window`, so the map is loaded in the browser only.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map…</div>,
});

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export default function LiveTracking() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const v = useFleet((s) => s.vehicles.find((x) => x.id === s.selectedId));

  // restore the saved sidebar state; phones start with both closed
  useEffect(() => {
    const small = window.matchMedia("(max-width: 820px)").matches;
    try {
      setLeftOpen(small ? false : localStorage.getItem("ft-left") !== "1");
      setRightOpen(small ? false : localStorage.getItem("ft-right") !== "1");
    } catch {
      if (small) {
        setLeftOpen(false);
        setRightOpen(false);
      }
    }
  }, []);

  const remember = (key: string, open: boolean) => {
    try {
      localStorage.setItem(key, open ? "0" : "1");
    } catch {}
  };
  const toggleLeft = () => {
    setLeftOpen((o) => {
      remember("ft-left", !o);
      return !o;
    });
  };
  const toggleRight = () => {
    setRightOpen((o) => {
      remember("ft-right", !o);
      return !o;
    });
  };

  return (
    <div className="shell">
      <aside className={`side left${leftOpen ? "" : " collapsed"}`} aria-label="Vehicle list">
        <button className="side-close" type="button" aria-label="Close vehicle list" onClick={toggleLeft}>×</button>
        <div className="side-inner">
          <VehicleList />
        </div>
      </aside>

      <main className="center">
        {v && (
          <div className="telemetry">
            <span>GSM <b>{v.gsm}</b></span>
            <span>GPS <b>{v.gps}</b></span>
            <span>Speed <b>{v.speed} km/h</b></span>
            <span>RPM <b>{v.rpm}</b></span>
            <span>Ext <b>{v.volt} V</b></span>
            <span>Mileage <b>{v.mileage.toFixed(1)} km</b></span>
          </div>
        )}
        <div className="map-wrap">
          <button className="edge-btn l" type="button" aria-expanded={leftOpen} aria-label="Toggle vehicle list" onClick={toggleLeft}>
            <Chevron />
          </button>
          <button className="edge-btn r" type="button" aria-expanded={rightOpen} aria-label="Toggle vehicle detail" onClick={toggleRight}>
            <Chevron />
          </button>
          <MapView />
          <div className="legend">
            {(["moving", "idle", "stopped", "offline"] as const).map((s) => (
              <span key={s} style={{ ["--c" as string]: STATUS_COLOR[s] }}>
                <i />
                {s[0].toUpperCase() + s.slice(1)}
              </span>
            ))}
          </div>
        </div>
        <VehicleDock />
      </main>

      <aside className={`side right${rightOpen ? "" : " collapsed"}`} aria-label="Vehicle detail">
        <div className="side-inner">
          <DetailPanel />
        </div>
      </aside>
    </div>
  );
}
