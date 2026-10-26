"use client";

import { useState } from "react";
import { PAGE_DEFS, RIGHTS_MODULES } from "@/lib/pages";

type Perm = [boolean, boolean, boolean, boolean]; // view, add, edit, delete
const HEADS = ["View", "Add", "Edit", "Delete"];
const roles = PAGE_DEFS["users/roles"].rows.map((r) => r[0]);

function defaults(role: string): Perm {
  if (role === "Admin") return [true, true, true, true];
  if (role === "Manager") return [true, true, true, false];
  return [true, false, false, false];
}

export default function RightsPage() {
  const [role, setRole] = useState(roles[0]);
  const [rights, setRights] = useState<Record<string, Record<string, Perm>>>(() =>
    Object.fromEntries(roles.map((r) => [r, Object.fromEntries(RIGHTS_MODULES.map((m) => [m.href, defaults(r)]))])),
  );

  const toggle = (href: string, pi: number, on: boolean) =>
    setRights((all) => {
      const perms = [...all[role][href]] as Perm;
      perms[pi] = on;
      return { ...all, [role]: { ...all[role], [href]: perms } };
    });

  return (
    <section className="page">
      <div className="page-head">
        <h1>User rights</h1>
        <span className="sub">{RIGHTS_MODULES.length} pages</span>
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
              {HEADS.map((h) => (
                <th key={h} className="c">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RIGHTS_MODULES.map((m) => (
              <tr key={m.href}>
                <td>{m.label}</td>
                {rights[role][m.href].map((on, pi) => (
                  <td key={pi} className="c">
                    <input
                      type="checkbox"
                      aria-label={`${HEADS[pi]} ${m.label}`}
                      checked={on}
                      onChange={(e) => toggle(m.href, pi, e.target.checked)}
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
