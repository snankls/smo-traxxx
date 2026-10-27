"use client";

// Users: list, search, add, edit and delete on this one page.
// Table: Sr # and checkbox columns, sorting on every column, show/hide columns, bulk delete.
// Everything in this file belongs to this page only. Data is kept in memory (no API).

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";

type Row = { id: number; name: string; username: string; password: string; confirmPassword: string; role: string; status: string; address: string };
type Form = Omit<Row, "id">;
type ColKey = "sr" | keyof Form;
type Item = { r: Row; sr: number }; // sr = fixed serial number of the row (its position in the full list)

const initialRows: Row[] = [
  { id: 1, name: "Admin User", username: "admin", password: "admin123", confirmPassword: "admin123", role: "Admin", status: "Active", address: "Head Office, Main Boulevard, Gulberg III, Lahore" },
  { id: 2, name: "Fleet Manager", username: "manager1", password: "manager123", confirmPassword: "manager123", role: "Manager", status: "Active", address: "House 12, Street 4, Model Town, Lahore" },
  { id: 3, name: "Control Room 1", username: "operator1", password: "operator123", confirmPassword: "operator123", role: "Operator", status: "Active", address: "Regional Office, Satellite Town, Rawalpindi" },
  { id: 4, name: "Client View", username: "client1", password: "client123", confirmPassword: "client123", role: "Viewer", status: "Inactive", address: "Plot 7, Latifabad Unit 6, Hyderabad" },
];

// Options of the Role select list (the active roles in the system).
const roles = ["Admin", "Manager", "Operator", "Viewer"];

const emptyForm: Form = { name: "", username: "", password: "", confirmPassword: "", role: "", status: "Active", address: "" };

// Data columns, in the same order as the form. The checkbox and Actions columns are always shown.
const columns: { key: ColKey; label: string }[] = [
  { key: "sr", label: "Sr #" },
  { key: "name", label: "Full name" },
  { key: "username", label: "Username" },
  { key: "password", label: "Password" },
  { key: "confirmPassword", label: "Confirm Password" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "address", label: "Address" },
];

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

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 64,
  padding: "8px 10px",
  background: "var(--panel-2)",
  border: "1px solid var(--line)",
  borderRadius: 6,
  font: "inherit",
  color: "inherit",
  resize: "vertical",
};

export default function UsersPage() {
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

  const roleOptions = form.role && !roles.includes(form.role) ? [...roles, form.role].sort() : roles;

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
    if (key === "username") return <td key={key} className="mono">{r.username}</td>;
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
    if (key === "address") {
      return (
        <td key={key} title={r.address} style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
          {r.address}
        </td>
      );
    }
    return <td key={key}>{r[key]}</td>;
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>Users</h1>
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
            Add user
          </button>
        </div>
      </div>

      {showForm && (
        <form className="card formcard" onSubmit={save} autoComplete="off">
          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input id="name" required autoFocus value={form.name} onChange={(e) => setField("name", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" required value={form.username} onChange={(e) => setField("username", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" required type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" required type="password" value={form.confirmPassword} onChange={(e) => setField("confirmPassword", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="brand">Role</label>
            <select id="role" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="">Select Role</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={(e) => setField("status", e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="address">Address</label>
            <textarea id="address" required style={textareaStyle} value={form.address} onChange={(e) => setField("address", e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn primary" type="submit">
              {editId === null ? "Add user" : "Save changes"}
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
                    aria-label={`Select ${item.r.name}`}
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