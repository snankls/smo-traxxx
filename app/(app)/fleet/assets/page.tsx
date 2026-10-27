"use client";

// Assets group: list, search, add, edit and delete on this one page.
// A group can have a parent group. Every group in the list (parent or child) can be picked as a parent.
// Table: Sr # and checkbox columns, sorting on every column, show/hide columns, bulk delete.
// Everything in this file belongs to this page only. Data is kept in memory (no API).

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";

type Row = { id: number; group: string; parentId: number | null; status: string };
type Form = { group: string; parentId: string; status: string }; // parentId "" means no parent
type ColKey = "sr" | "group" | "parent" | "status";
type Item = { r: Row; sr: number }; // sr = fixed serial number of the row (its position in the full list)

const initialRows: Row[] = [
  { id: 1, group: "Lahore", parentId: null, status: "Active" },
  { id: 2, group: "Rawalpindi", parentId: null, status: "Active" },
  { id: 3, group: "Hyderabad", parentId: null, status: "Active" },
  { id: 4, group: "Lahore North", parentId: 1, status: "Active" },
  { id: 5, group: "Lahore South", parentId: 1, status: "Active" },
  { id: 6, group: "Gulberg", parentId: 4, status: "Inactive" },
];

const emptyForm: Form = { group: "", parentId: "", status: "Active" };

// Data columns. The checkbox and Actions columns are always shown.
const columns: { key: ColKey; label: string }[] = [
  { key: "sr", label: "Sr #" },
  { key: "group", label: "Group" },
  { key: "parent", label: "Parent group" },
  { key: "status", label: "Status" },
];

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

export default function AssetsPage() {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  // sortKey null = tree order (each parent followed by its children)
  const [sortKey, setSortKey] = useState<ColKey | null>(null);
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

  const byId = (id: number | null) => rows.find((r) => r.id === id);
  const childrenOf = (id: number) => rows.filter((r) => r.parentId === id);

  // "Lahore > Lahore North > Gulberg"
  function pathOf(r: Row): string {
    const names = [r.group];
    let p = byId(r.parentId);
    while (p) {
      names.unshift(p.group);
      p = byId(p.parentId);
    }
    return names.join(" > ");
  }

  function depthOf(r: Row): number {
    let d = 0;
    let p = byId(r.parentId);
    while (p) {
      d++;
      p = byId(p.parentId);
    }
    return d;
  }

  // the group itself and everything below it (not allowed as its own parent)
  function selfAndDescendants(id: number): number[] {
    return [id, ...childrenOf(id).flatMap((c) => selfAndDescendants(c.id))];
  }

  // list order: each parent followed by its children
  function ordered(parentId: number | null): Row[] {
    return rows.filter((r) => r.parentId === parentId).flatMap((r) => [r, ...ordered(r.id)]);
  }

  function valueOf(item: Item, key: ColKey): string | number {
    if (key === "sr") return item.sr;
    if (key === "group") return item.r.group;
    if (key === "status") return item.r.status;
    const parent = byId(item.r.parentId);
    return parent ? pathOf(parent) : "";
  }

  const shown = columns.filter((c) => !hidden.includes(c.key));
  const needle = search.trim().toLowerCase();

  let visible: Item[] = ordered(null)
    .map((r) => ({ r, sr: rows.indexOf(r) + 1 }))
    .filter(({ r }) => !needle || `${pathOf(r)} ${r.status}`.toLowerCase().includes(needle));

  if (sortKey) {
    const key = sortKey;
    visible = [...visible].sort((a, b) => {
      const x = valueOf(a, key);
      const y = valueOf(b, key);
      const c =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? c : -c;
    });
  }

  // indent and the └ mark are shown only in tree order
  const treeMode = !needle && !sortKey;

  const blocked = editId === null ? [] : selfAndDescendants(editId);
  const parentOptions = ordered(null).filter((r) => !blocked.includes(r.id));

  const allChecked = visible.length > 0 && visible.every(({ r }) => selected.includes(r.id));
  const someChecked = visible.some(({ r }) => selected.includes(r.id));
  // a selected group that has a child which is not selected cannot be deleted yet
  const bulkBlocked = selected.some((id) => childrenOf(id).some((c) => !selected.includes(c.id)));

  // click: ascending, click again: descending, click again: back to tree order
  function sortBy(key: ColKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
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

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(r: Row) {
    setEditId(r.id);
    setForm({ group: r.group, parentId: r.parentId === null ? "" : String(r.parentId), status: r.status });
    setConfirmId(null);
    setShowForm(true);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    const parentId = form.parentId === "" ? null : Number(form.parentId);
    const group = form.group.trim();
    if (editId === null) {
      const nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      setRows([...rows, { id: nextId, group, parentId, status: form.status }]);
    } else {
      setRows(rows.map((r) => (r.id === editId ? { id: editId, group, parentId, status: form.status } : r)));
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
    if (bulkBlocked) return;
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
    switch (key) {
      case "sr":
        return <td key={key} className="mono">{item.sr}</td>;
      case "group": {
        const depth = treeMode ? depthOf(r) : 0;
        return (
          <td key={key} style={{ paddingLeft: 14 + depth * 22 }}>
            {depth > 0 && <span style={{ color: "var(--muted)" }}>└ </span>}
            {r.group}
          </td>
        );
      }
      case "parent": {
        const parent = byId(r.parentId);
        return <td key={key}>{parent ? pathOf(parent) : "-"}</td>;
      }
      case "status":
        return (
          <td key={key}>
            <span className="pill" style={{ ["--c" as string]: r.status === "Active" ? "var(--moving)" : "var(--offline)" }}>
              <i />
              {r.status}
            </span>
          </td>
        );
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>Assets group</h1>
        <span className="sub">
          {rows.length} records{selected.length > 0 ? `, ${selected.length} selected` : ""}
        </span>
        <div className="toolbar">
          {selected.length > 0 && (
            <button
              className="btn"
              type="button"
              disabled={bulkBlocked}
              title={bulkBlocked ? "A selected group still has child groups that are not selected" : undefined}
              style={{ color: "var(--stopped)", opacity: bulkBlocked ? 0.4 : 1, cursor: bulkBlocked ? "not-allowed" : "pointer" }}
              onClick={removeSelected}
            >
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
            Add group
          </button>
        </div>
      </div>

      {showForm && (
        <form className="card formcard" onSubmit={save} autoComplete="off">
          <div className="field">
            <label htmlFor="parent">Parent Group</label>
            <select id="parent" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">Select Parent Group</option>
              {parentOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {"\u00A0\u00A0\u00A0\u00A0".repeat(depthOf(r))}
                  {depthOf(r) > 0 ? "└ " : ""}
                  {r.group}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="group">Group Name</label>
            <input id="group" required autoFocus value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn primary" type="submit">
              {editId === null ? "Add group" : "Save changes"}
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
            {visible.map((item) => {
              const hasChildren = childrenOf(item.r.id).length > 0;
              return (
                <tr key={item.r.id} className={selected.includes(item.r.id) ? "sel" : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.r.group}`}
                      checked={selected.includes(item.r.id)}
                      onChange={(e) => toggleRow(item.r.id, e.target.checked)}
                    />
                  </td>
                  {shown.map((c) => renderCell(item, c.key))}
                  <td className="act">
                    <button type="button" onClick={() => openEdit(item.r)}>Edit</button>
                    <button
                      type="button"
                      className="danger"
                      disabled={hasChildren}
                      title={hasChildren ? "Delete or move its child groups first" : undefined}
                      style={hasChildren ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                      onClick={() => remove(item.r.id)}
                    >
                      {confirmId === item.r.id ? "Confirm delete" : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}