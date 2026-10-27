"use client";

// City: list, search, add, edit and delete on this one page.
// Country is picked from a select list, then State / Province shows only the states of that country.
// Table: Sr # and checkbox columns, sorting on every column, show/hide columns, bulk delete.
// Everything in this file belongs to this page only. Data is kept in memory (no API).

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";

type Row = { id: number; city: string; state: string; country: string; status: string };
type Form = Omit<Row, "id">;
type ColKey = "sr" | keyof Form;
type Item = { r: Row; sr: number }; // sr = fixed serial number of the row (its position in the full list)

const initialRows: Row[] = [
  { id: 1, city: "Lahore", state: "Punjab", country: "Pakistan", status: "Active" },
  { id: 2, city: "Rawalpindi", state: "Punjab", country: "Pakistan", status: "Active" },
  { id: 3, city: "Bahawalpur", state: "Punjab", country: "Pakistan", status: "Active" },
  { id: 4, city: "Karachi", state: "Sindh", country: "Pakistan", status: "Active" },
  { id: 5, city: "Hyderabad", state: "Sindh", country: "Pakistan", status: "Active" },
];

// Country select list, and the states of each country (same data as the Country and State pages).
const countries = ["Pakistan", "Saudi Arabia", "United Arab Emirates"];
const statesByCountry: Record<string, string[]> = {
  Pakistan: ["Balochistan", "Islamabad Capital Territory", "Khyber Pakhtunkhwa", "Punjab", "Sindh"],
};

const emptyForm: Form = { city: "", state: "", country: "", status: "Active" };

// Data columns. The checkbox and Actions columns are always shown.
const columns: { key: ColKey; label: string }[] = [
  { key: "sr", label: "Sr #" },
  { key: "city", label: "City" },
  { key: "state", label: "State / Province" },
  { key: "country", label: "Country" },
  { key: "status", label: "Status" },
];

function valueOf(item: Item, key: ColKey): string | number {
  return key === "sr" ? item.sr : item.r[key];
}

// states of one country, plus any state already saved on a row of that country, sorted
function statesOf(country: string, rows: Row[], extra?: string): string[] {
  if (!country) return [];
  const all = [...(statesByCountry[country] ?? []), ...rows.filter((r) => r.country === country).map((r) => r.state)];
  if (extra) all.push(extra);
  return Array.from(new Set(all)).sort();
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

export default function CitiesPage() {
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
    .filter(({ r }) => !needle || `${r.city} ${r.state} ${r.country} ${r.status}`.toLowerCase().includes(needle))
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

  // options of the form select lists (a value already saved on a row stays selectable)
  const formCountries = form.country && !countries.includes(form.country) ? [...countries, form.country].sort() : countries;
  const formStates = statesOf(form.country, rows, form.state);

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

  // picking another country empties the state, because the old one belongs to the previous country
  function setFormCountry(value: string) {
    setForm({ ...form, country: value, state: "" });
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setConfirmId(null);
    setShowForm(true);
  }

  function openEdit(r: Row) {
    const { id, ...rest } = r;
    setEditId(id);
    setForm(rest);
    setConfirmId(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    const data: Form = { ...form, city: form.city.trim() };
    if (!data.city || !data.country || !data.state) return; // blank / spaces-only city, or no country / state
    if (editId === null) {
      const nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      setRows([...rows, { id: nextId, ...data }]);
    } else {
      setRows(rows.map((r) => (r.id === editId ? { id: editId, ...data } : r)));
    }
    closeForm();
  }

  function remove(id: number) {
    if (confirmId === id) {
      setRows(rows.filter((r) => r.id !== id));
      setSelected(selected.filter((x) => x !== id));
      setConfirmId(null);
      if (editId === id) closeForm(); // the row being edited no longer exists
    } else {
      setConfirmId(id);
    }
  }

  function removeSelected() {
    if (confirmBulk) {
      setRows(rows.filter((r) => !selected.includes(r.id)));
      if (editId !== null && selected.includes(editId)) closeForm();
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
          <span className="pill" style={{ ["--c" as string]: r.status === "Active" ? "var(--moving)" : "var(--offline)" } as CSSProperties}>
            <i />
            {r.status}
          </span>
        </td>
      );
    }
    return <td key={key}>{r[key]}</td>;
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>City</h1>
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
            Add city
          </button>
        </div>
      </div>

      {showForm && (
        <form className="card formcard" onSubmit={save} autoComplete="off">
          <div className="field">
            <label htmlFor="country">Country</label>
            <select id="country" required autoFocus value={form.country} onChange={(e) => setFormCountry(e.target.value)}>
              <option value="">Select Country</option>
              {formCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="state">State / Province</label>
            <select id="state" required disabled={!form.country} value={form.state} onChange={(e) => setField("state", e.target.value)}>
              <option value="">
                {!form.country ? "Select country first" : formStates.length === 0 ? "No states for this country" : "Select State / Province"}
              </option>
              {formStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" required value={form.city} onChange={(e) => setField("city", e.target.value)} />
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
              {editId === null ? "Add city" : "Save changes"}
            </button>
            <button className="btn" type="button" onClick={closeForm}>
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
                    aria-label={`Select ${item.r.city}`}
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