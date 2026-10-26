"use client";

import { useState } from "react";
import { STATUS_COLOR, Status } from "@/lib/data";
import { Filter, useFleet } from "@/lib/store";

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: "all", label: "All", color: "var(--accent)" },
  { key: "moving", label: "Moving", color: STATUS_COLOR.moving },
  { key: "idle", label: "Idle", color: STATUS_COLOR.idle },
  { key: "stopped", label: "Stopped", color: STATUS_COLOR.stopped },
  { key: "offline", label: "Offline", color: STATUS_COLOR.offline },
];

export default function VehicleList() {
  const { vehicles, checked, selectedId, filter, query, follow } = useFleet();
  const { select, setChecked, clearChecked, setFilter, setQuery, toggleFollow } = useFleet.getState();
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const counts: Record<string, number> = { all: vehicles.length, moving: 0, idle: 0, stopped: 0, offline: 0 };
  vehicles.forEach((v) => counts[v.status as Status]++);

  const needle = query.trim().toLowerCase();
  const list = vehicles.filter(
    (v) => (filter === "all" || v.status === filter) && (!needle || `${v.name} ${v.group}`.toLowerCase().includes(needle)),
  );
  const groups = Array.from(new Set(vehicles.map((v) => v.group)));

  return (
    <>
      <div className="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input type="search" placeholder="Search vehicle or group" autoComplete="off" aria-label="Search vehicles" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className="chip" aria-pressed={filter === f.key} style={{ ["--c" as string]: f.color }} onClick={() => setFilter(f.key)}>
            <i />
            {f.label} <b>{counts[f.key]}</b>
          </button>
        ))}
      </div>

      <div className="tree">
        {list.length === 0 && <div className="empty">No vehicles match.</div>}
        {groups.map((g) => {
          const items = list.filter((v) => v.group === g);
          if (!items.length) return null;
          const all = items.every((v) => checked[v.id]);
          return (
            <div key={g} className={`grp${closed[g] ? " closed" : ""}`}>
              <div className="grp-head">
                <button className="twist" type="button" aria-label={`Expand or collapse ${g}`} onClick={() => setClosed((c) => ({ ...c, [g]: !c[g] }))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <input type="checkbox" aria-label={`Select group ${g}`} checked={all} onChange={(e) => setChecked(items.map((v) => v.id), e.target.checked)} />
                <span>{g}</span>
                <span className="count">{items.length}</span>
              </div>
              <div className="veh-list">
                {items.map((v) => (
                  <div key={v.id} className={`veh${v.id === selectedId ? " sel" : ""}`} onClick={() => select(v.id)}>
                    <input
                      type="checkbox"
                      aria-label={`Show ${v.name}`}
                      checked={!!checked[v.id]}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setChecked([v.id], e.target.checked)}
                    />
                    <span className="dot" style={{ ["--c" as string]: STATUS_COLOR[v.status] }} />
                    <span className="nm">{v.name}</span>
                    <span className="spd">{v.speed} km/h</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="side-foot">
        <button type="button" onClick={() => setChecked(list.map((v) => v.id), true)}>Select all</button>
        <button type="button" onClick={clearChecked}>Clear</button>
        <button type="button" aria-pressed={follow} onClick={toggleFollow}>Follow</button>
      </div>
    </>
  );
}
