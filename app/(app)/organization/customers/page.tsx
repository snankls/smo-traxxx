"use client";

// Customers: list, search, add, edit and delete on this one page.
// Company and Gender are picked from select lists.
// Table: Sr # and checkbox columns, sorting on every column, show/hide columns, bulk delete.
// Everything in this file belongs to this page only. Data is kept in memory (no API).

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";

type Row = {
  id: number;
  customerId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  mobile: string;
  gender: string;
  dob: string;
  rfId: string;
  isDriver: boolean;
  status: string;
  address: string;
};
type Form = Omit<Row, "id">;
type TextKey = Exclude<keyof Form, "isDriver">; // every field that holds text
type ColKey = "sr" | keyof Form;
type Item = { r: Row; sr: number }; // sr = fixed serial number of the row (its position in the full list)

const initialRows: Row[] = [
  { id: 1, customerId: "CUS-001", name: "Customer A", company: "Sample Logistics", email: "a@example.com", phone: "042 0000101", mobile: "0300 0000101", gender: "Male", dob: "1990-05-14", rfId: "RF1001", isDriver: true, status: "Active", address: "Gulberg III, Lahore" },
  { id: 2, customerId: "CUS-002", name: "Customer B", company: "Sample Logistics", email: "b@example.com", phone: "021 0000102", mobile: "0300 0000102", gender: "Female", dob: "1988-11-02", rfId: "RF1002", isDriver: false, status: "Active", address: "Clifton, Karachi" },
  { id: 3, customerId: "CUS-003", name: "Customer C", company: "Sample Transport", email: "c@example.com", phone: "051 0000103", mobile: "0300 0000103", gender: "Male", dob: "1995-01-23", rfId: "RF1003", isDriver: true, status: "Inactive", address: "Saddar, Rawalpindi" },
];

// Options of the select lists (companies are the ones on the Companies page).
const companies = ["Sample Cargo", "Sample Logistics", "Sample Transport"];
const genders = ["Male", "Female", "Other"];

const emptyForm: Form = {
  customerId: "", name: "", company: "", email: "", phone: "", mobile: "", gender: "", dob: "", rfId: "", isDriver: false, status: "Active", address: "",
};

// Data columns, in the same order as the form. The checkbox and Actions columns are always shown.
const columns: { key: ColKey; label: string }[] = [
  { key: "sr", label: "Sr #" },
  { key: "customerId", label: "Customer ID" },
  { key: "name", label: "Customer name" },
  { key: "company", label: "Company" },
  { key: "email", label: "Email address" },
  { key: "phone", label: "Phone number" },
  { key: "mobile", label: "Mobile number" },
  { key: "gender", label: "Gender" },
  { key: "dob", label: "DOB" },
  { key: "rfId", label: "RF ID" },
  { key: "isDriver", label: "Is driver?" },
  { key: "status", label: "Status" },
  { key: "address", label: "Address" },
];

// the less used columns start hidden; they can be turned on from the Columns menu
const defaultHidden: ColKey[] = ["gender", "dob", "address"];

function valueOf(item: Item, key: ColKey): string | number {
  if (key === "sr") return item.sr;
  if (key === "isDriver") return item.r.isDriver ? "Yes" : "No";
  return item.r[key];
}

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

export default function CustomersPage() {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const [sortKey, setSortKey] = useState<ColKey>("sr");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hidden, setHidden] = useState<ColKey[]>(defaultHidden);
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
    .filter(
      ({ r }) =>
        !needle ||
        [r.customerId, r.name, r.company, r.email, r.phone, r.mobile, r.gender, r.dob, r.rfId, r.isDriver ? "driver" : "", r.status, r.address]
          .join(" ")
          .toLowerCase()
          .includes(needle),
    )
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

  // a value already saved on a row stays selectable even if it is not in the lists above
  const companyOptions = form.company && !companies.includes(form.company) ? [...companies, form.company].sort() : companies;
  const genderOptions = form.gender && !genders.includes(form.gender) ? [...genders, form.gender] : genders;

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

  function setField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }) as Form);
    setError("");
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setConfirmId(null);
    setShowForm(true);
  }

  function openEdit(r: Row) {
    const { id, ...rest } = r;
    setEditId(id);
    setForm(rest);
    setError("");
    setConfirmId(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setError("");
  }

  function save(e: FormEvent) {
    e.preventDefault();
    // trim every text field; spaces-only values are not allowed
    const data = { ...form } as Form;
    const textKeys = (Object.keys(form) as (keyof Form)[]).filter((k): k is TextKey => typeof form[k] === "string");
    for (const k of textKeys) data[k] = form[k].trim();
    if (textKeys.some((k) => !data[k])) return setError("Please fill in all the fields.");
    if (rows.some((r) => r.id !== editId && r.customerId.toLowerCase() === data.customerId.toLowerCase())) {
      return setError(`Customer ID ${data.customerId} already exists.`);
    }

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
    const mono = key === "customerId" || key === "phone" || key === "mobile" || key === "rfId";
    return <td key={key} className={mono ? "mono" : undefined}>{valueOf(item, key)}</td>;
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>Customers</h1>
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
            Add customer
          </button>
        </div>
      </div>

      {showForm && (
        <form className="card formcard" onSubmit={save} autoComplete="off">
          <div className="field">
            <label htmlFor="customerId">Customer ID</label>
            <input id="customerId" required autoFocus value={form.customerId} onChange={(e) => setField("customerId", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="name">Customer Name</label>
            <input id="name" required value={form.name} onChange={(e) => setField("name", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="company">Company</label>
            <select id="company" required value={form.company} onChange={(e) => setField("company", e.target.value)}>
              <option value="">Select Company</option>
              {companyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" required value={form.email} onChange={(e) => setField("email", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" type="tel" required value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mobile">Mobile Number</label>
            <input id="mobile" type="tel" required value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="gender">Gender</label>
            <select id="gender" required value={form.gender} onChange={(e) => setField("gender", e.target.value)}>
              <option value="">Select Gender</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="dob">DOB</label>
            <input id="dob" type="date" required value={form.dob} onChange={(e) => setField("dob", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rfId">RF ID</label>
            <input id="rfId" required value={form.rfId} onChange={(e) => setField("rfId", e.target.value)} />
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
          <div className="field" style={{ alignSelf: "end" }}>
            <label htmlFor="isDriver" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                id="isDriver"
                type="checkbox"
                style={{ width: 18, height: 18, padding: 0, margin: 0 }}
                checked={form.isDriver}
                onChange={(e) => setField("isDriver", e.target.checked)}
              />
              Is Driver?
            </label>
          </div>
          <div className="form-actions">
            <button className="btn primary" type="submit">
              {editId === null ? "Add customer" : "Save changes"}
            </button>
            <button className="btn" type="button" onClick={closeForm}>
              Cancel
            </button>
            {error && (
              <span role="alert" style={{ color: "var(--stopped)", alignSelf: "center" }}>
                {error}
              </span>
            )}
          </div>
        </form>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
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