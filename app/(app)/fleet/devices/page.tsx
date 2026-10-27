"use client";

// Device info: list, search, add, edit and delete on this one page.
// Table: Sr # and checkbox columns, sorting on every column, show/hide columns, bulk delete.
// Everything in this file belongs to this page only. Data is kept in memory (no API).

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";

type Row = {
  id: number;
  deviceId: string;
  deviceType: string;
  deviceModel: string;
  iccId: string;
  sim: string;
  simServer: string;
  softwareVersion: string;
  hardwareVersion: string;
  status: string;
};
type Form = Omit<Row, "id">;
type ColKey = "sr" | keyof Form;
type Item = { r: Row; sr: number }; // sr = fixed serial number of the row (its position in the full list)

const initialRows: Row[] = [
  { id: 1, deviceId: "356495049228000", deviceType: "GS", deviceModel: "G6S", iccId: "8992010000000000001", sim: "923450802900", simServer: "SRV-01", softwareVersion: "2.1.4", hardwareVersion: "HW-1.0", status: "Active" },
  { id: 2, deviceId: "356495049228037", deviceType: "GS", deviceModel: "G6S", iccId: "8992010000000000002", sim: "923450802913", simServer: "SRV-01", softwareVersion: "2.1.4", hardwareVersion: "HW-1.0", status: "Active" },
  { id: 3, deviceId: "356495049228074", deviceType: "GS", deviceModel: "G6S", iccId: "8992010000000000003", sim: "923450802926", simServer: "SRV-01", softwareVersion: "2.1.3", hardwareVersion: "HW-1.0", status: "Active" },
  { id: 4, deviceId: "356495049228111", deviceType: "GS", deviceModel: "G6S", iccId: "8992010000000000004", sim: "923450802939", simServer: "SRV-02", softwareVersion: "2.1.3", hardwareVersion: "HW-1.1", status: "Active" },
  { id: 5, deviceId: "356495049228148", deviceType: "GS", deviceModel: "G6S", iccId: "8992010000000000005", sim: "923450802952", simServer: "SRV-02", softwareVersion: "2.1.4", hardwareVersion: "HW-1.1", status: "Active" },
  { id: 6, deviceId: "356495049228185", deviceType: "GS", deviceModel: "G6S", iccId: "8992010000000000006", sim: "923450802965", simServer: "SRV-02", softwareVersion: "2.0.9", hardwareVersion: "HW-1.0", status: "Inactive" },
  { id: 7, deviceId: "356495049228222", deviceType: "GS", deviceModel: "G6S", iccId: "8992010000000000007", sim: "923450802978", simServer: "SRV-03", softwareVersion: "2.1.4", hardwareVersion: "HW-1.1", status: "Active" },
  { id: 8, deviceId: "356495049228259", deviceType: "GS", deviceModel: "G6S", iccId: "8992010000000000008", sim: "923450802991", simServer: "SRV-03", softwareVersion: "2.1.4", hardwareVersion: "HW-1.1", status: "Active" },
  { id: 9, deviceId: "356495049228296", deviceType: "GS", deviceModel: "G6S", iccId: "8992010000000000009", sim: "923450803004", simServer: "SRV-03", softwareVersion: "2.1.3", hardwareVersion: "HW-1.0", status: "Active" },
];

const emptyForm: Form = {
  deviceId: "",
  deviceType: "",
  deviceModel: "",
  iccId: "",
  sim: "",
  simServer: "",
  softwareVersion: "",
  hardwareVersion: "",
  status: "Active",
};

// Data columns. The checkbox and Actions columns are always shown.
const columns: { key: ColKey; label: string }[] = [
  { key: "sr", label: "Sr #" },
  { key: "deviceId", label: "Device ID" },
  { key: "deviceType", label: "Device type" },
  { key: "deviceModel", label: "Device model" },
  { key: "iccId", label: "ICC ID" },
  { key: "sim", label: "SIM #" },
  { key: "simServer", label: "SIM server #" },
  { key: "softwareVersion", label: "Software version" },
  { key: "hardwareVersion", label: "Hardware version" },
  { key: "status", label: "Status" },
];

// columns shown in the monospace font
const monoCols: ColKey[] = ["deviceId", "iccId", "sim", "simServer", "softwareVersion", "hardwareVersion"];

function valueOf(item: Item, key: ColKey): string | number {
  return key === "sr" ? item.sr : item.r[key];
}

const sortButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: 0,
  background: "none",
  padding: 0,
  font: "inherit",
  color: "inherit",
  textTransform: "inherit",
  letterSpacing: "inherit",
  cursor: "pointer",
};

const menuBox: CSSProperties = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 4px)",
  zIndex: 30,
  minWidth: 190,
  padding: 6,
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 6,
  boxShadow: "0 6px 18px rgba(0,0,0,.2)",
};

const menuRow: CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer" };

export default function DevicesPage() {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const [sortKey, setSortKey] = useState<ColKey>("sr");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hidden, setHidden] = useState<ColKey[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close the Columns menu on outside click or Escape
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const shown = columns.filter((c) => !hidden.includes(c.key));
  const needle = search.trim().toLowerCase();

  const visible: Item[] = rows
    .map((r, i) => ({ r, sr: i + 1 }))
    .filter(({ r }) => !needle || Object.values(r).join(" ").toLowerCase().includes(needle))
    .sort((a, b) => {
      const x = valueOf(a, sortKey);
      const y = valueOf(b, sortKey);
      const c =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? c : -c;
    });

  const allChecked = visible.length > 0 && visible.every(({ r }) => selected.includes(r.id));
  const someChecked = visible.some(({ r }) => selected.includes(r.id));

  function sortBy(key: ColKey) {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleColumn(key: ColKey) {
    setHidden(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]);
  }

  function toggleRow(id: number, on: boolean) {
    setSelected(on ? [...selected, id] : selected.filter((x) => x !== id));
    setConfirmBulk(false);
  }

  function toggleAll(on: boolean) {
    const ids = visible.map(({ r }) => r.id);
    setSelected(on ? Array.from(new Set([...selected, ...ids])) : selected.filter((x) => !ids.includes(x)));
    setConfirmBulk(false);
  }

  function setField(key: keyof Form, value: string) {
    setForm({ ...form, [key]: value });
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(r: Row) {
    const { id, ...rest } = r;
    setEditId(id);
    setForm(rest);
    setConfirmId(null);
    setShowForm(true);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (editId === null) {
      const nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      setRows([...rows, { id: nextId, ...form }]);
    } else {
      setRows(rows.map((r) => (r.id === editId ? { id: editId, ...form } : r)));
    }
    setShowForm(false);
    setEditId(null);
  }

  function remove(id: number) {
    if (confirmId === id) {
      setRows(rows.filter((r) => r.id !== id));
      setSelected(selected.filter((x) => x !== id));
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  }

  function removeSelected() {
    if (confirmBulk) {
      setRows(rows.filter((r) => !selected.includes(r.id)));
      setSelected([]);
      setConfirmBulk(false);
    } else {
      setConfirmBulk(true);
    }
  }

  function renderCell(item: Item, key: ColKey) {
    const r = item.r;
    if (key === "sr") return <td key={key} className="mono">{item.sr}</td>;
    if (key === "status") {
      return (
        <td key={key}>
          <span className="pill" style={{ ["--c" as string]: r.status === "Active" ? "var(--moving)" : "var(--offline)" }}>
            <i />
            {r.status}
          </span>
        </td>
      );
    }
    return <td key={key} className={monoCols.includes(key) ? "mono" : undefined}>{r[key]}</td>;
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>Device info</h1>
        <span className="sub">
          {rows.length} records{selected.length > 0 ? `, ${selected.length} selected` : ""}
        </span>
        <div className="toolbar">
          {selected.length > 0 && (
            <button className="btn" type="button" style={{ color: "var(--stopped)" }} onClick={removeSelected}>
              {confirmBulk ? `Confirm delete ${selected.length}` : `Delete selected (${selected.length})`}
            </button>
          )}
          <input type="search" placeholder="Search" aria-label="Search records" value={search} onChange={(e) => setSearch(e.target.value)} />

          <div ref={menuRef} style={{ position: "relative" }}>
            <button className="btn" type="button" aria-expanded={menuOpen} aria-haspopup="true" onClick={() => setMenuOpen(!menuOpen)}>
              Columns ({shown.length}/{columns.length})
            </button>
            {menuOpen && (
              <div style={menuBox} role="group" aria-label="Show or hide columns">
                {columns.map((c) => (
                  <label key={c.key} style={menuRow}>
                    <input type="checkbox" checked={!hidden.includes(c.key)} onChange={() => toggleColumn(c.key)} />
                    {c.label}
                  </label>
                ))}
                <button className="btn" type="button" style={{ width: "100%", marginTop: 4 }} onClick={() => setHidden([])}>
                  Show all
                </button>
              </div>
            )}
          </div>

          <button className="btn primary" type="button" onClick={openAdd}>
            Add device
          </button>
        </div>
      </div>

      {showForm && (
        <form className="card formcard" onSubmit={save} autoComplete="off">
          <div className="field">
            <label htmlFor="deviceId">Device ID</label>
            <input id="deviceId" required autoFocus value={form.deviceId} onChange={(e) => setField("deviceId", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="deviceType">Device Type</label>
            <input id="deviceType" required value={form.deviceType} onChange={(e) => setField("deviceType", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="deviceModel">Device Model</label>
            <input id="deviceModel" required value={form.deviceModel} onChange={(e) => setField("deviceModel", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="iccId">ICC ID</label>
            <input id="iccId" required value={form.iccId} onChange={(e) => setField("iccId", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="sim">SIM #</label>
            <input id="sim" required value={form.sim} onChange={(e) => setField("sim", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="simServer">SIM Server #</label>
            <input id="simServer" required value={form.simServer} onChange={(e) => setField("simServer", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="softwareVersion">Software Version</label>
            <input id="softwareVersion" required value={form.softwareVersion} onChange={(e) => setField("softwareVersion", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="hardwareVersion">Hardware Version</label>
            <input id="hardwareVersion" required value={form.hardwareVersion} onChange={(e) => setField("hardwareVersion", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={(e) => setField("status", e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn primary" type="submit">
              {editId === null ? "Add device" : "Save changes"}
            </button>
            <button className="btn" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked && !allChecked;
                  }}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              {shown.map((c) => (
                <th key={c.key} aria-sort={sortKey === c.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" style={sortButton} onClick={() => sortBy(c.key)}>
                    {c.label}
                    <span aria-hidden="true" style={{ opacity: sortKey === c.key ? 1 : 0.35 }}>
                      {sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                    </span>
                  </button>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={shown.length + 2} className="empty">
                  No records found.
                </td>
              </tr>
            )}
            {visible.map((item) => (
              <tr key={item.r.id} className={selected.includes(item.r.id) ? "sel" : undefined}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.r.deviceId}`}
                    checked={selected.includes(item.r.id)}
                    onChange={(e) => toggleRow(item.r.id, e.target.checked)}
                  />
                </td>
                {shown.map((c) => renderCell(item, c.key))}
                <td className="act">
                  <button type="button" onClick={() => openEdit(item.r)}>Edit</button>
                  <button type="button" className="danger" onClick={() => remove(item.r.id)}>
                    {confirmId === item.r.id ? "Confirm delete" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}