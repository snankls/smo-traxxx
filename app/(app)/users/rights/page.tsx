"use client";

// User rights: pick a role, then tick what that role may do on each page.
// Everything in this file belongs to this page only. Data is kept in memory (no API).

import { useState } from "react";

type Perm = { view: boolean; add: boolean; edit: boolean; delete: boolean };
type PermKey = keyof Perm;

const roles = ["Admin", "Manager", "Operator", "Viewer"];

const pages = [
  "Live tracking",
  "Vehicle info",
  "Device info",
  "Primary SIM numbers",
  "Drivers info",
  "Assets group",
  "Brand",
  "Brand type",
  "Vehicle colors",
  "Companies",
  "Customers",
  "Users",
  "User roles",
  "Country",
  "State",
  "City",
];

const columns: { key: PermKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "add", label: "Add" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
];

function defaultPerm(role: string): Perm {
  if (role === "Admin") return { view: true, add: true, edit: true, delete: true };
  if (role === "Manager") return { view: true, add: true, edit: true, delete: false };
  return { view: true, add: false, edit: false, delete: false };
}

function buildInitial() {
  const all: Record<string, Record<string, Perm>> = {};
  roles.forEach((role) => {
    all[role] = {};
    pages.forEach((p) => {
      all[role][p] = defaultPerm(role);
    });
  });
  return all;
}

export default function UserRightsPage() {
  const [role, setRole] = useState(roles[0]);
  const [rights, setRights] = useState(buildInitial);

  function toggle(page: string, key: PermKey, on: boolean) {
    setRights({
      ...rights,
      [role]: { ...rights[role], [page]: { ...rights[role][page], [key]: on } },
    });
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>User rights</h1>
        <span className="sub">{pages.length} pages</span>
      </div>

      <div className="field" style={{ maxWidth: 260, marginBottom: 12 }}>
        <label htmlFor="role">Role</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="card rights">
        <table>
          <thead>
            <tr>
              <th>Page</th>
              {columns.map((c) => (
                <th key={c.key} className="c">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p}>
                <td>{p}</td>
                {columns.map((c) => (
                  <td key={c.key} className="c">
                    <input
                      type="checkbox"
                      aria-label={`${c.label} ${p}`}
                      checked={rights[role][p][c.key]}
                      onChange={(e) => toggle(p, c.key, e.target.checked)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
