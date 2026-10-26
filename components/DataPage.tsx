"use client";

import { FormEvent, useState } from "react";
import type { PageDef } from "@/lib/pages";

function Cell({ col, value }: { col: string; value: string }) {
  if (col === "Status") {
    const c = value === "Active" ? "var(--moving)" : "var(--offline)";
    return (
      <span className="pill" style={{ ["--c" as string]: c }}>
        <i />
        {value}
      </span>
    );
  }
  if (col === "Hex") {
    return (
      <>
        <span className="sw" style={{ background: value }} />
        {value}
      </>
    );
  }
  return <>{value}</>;
}

// Generic list + add/edit/delete page. Rows live in local state for now;
// replace the three handlers with API calls when the Laravel endpoints exist.
export default function DataPage({ def }: { def: PageDef }) {
  const [rows, setRows] = useState<string[][]>(() => def.rows.map((r) => [...r]));
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [draft, setDraft] = useState<string[]>([]);
  const [delIdx, setDelIdx] = useState(-1);

  const openAdd = () => {
    setEditIdx(-1);
    setDraft(def.cols.map(() => ""));
    setFormOpen(true);
  };
  const openEdit = (i: number) => {
    setEditIdx(i);
    setDraft([...rows[i]]);
    setDelIdx(-1);
    setFormOpen(true);
  };
  const save = (e: FormEvent) => {
    e.preventDefault();
    const clean = draft.map((v) => v.trim());
    setRows((rs) => (editIdx >= 0 ? rs.map((r, i) => (i === editIdx ? clean : r)) : [...rs, clean]));
    setFormOpen(false);
    setEditIdx(-1);
  };
  const remove = (i: number) => {
    if (delIdx === i) {
      setRows((rs) => rs.filter((_, k) => k !== i));
      setDelIdx(-1);
    } else setDelIdx(i);
  };

  const needle = q.trim().toLowerCase();
  const visible = rows.map((r, i) => ({ r, i })).filter(({ r }) => !needle || r.join(" ").toLowerCase().includes(needle));

  return (
    <section className="page">
      <div className="page-head">
        <h1>{def.title}</h1>
        <span className="sub">{rows.length} records</span>
        <div className="toolbar">
          <input type="search" placeholder="Search" aria-label="Search records" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn primary" type="button" onClick={openAdd}>
            Add {def.noun}
          </button>
        </div>
      </div>

      {formOpen && (
        <form className="card formcard" onSubmit={save} autoComplete="off">
          {def.cols.map((c, i) => (
            <div className="field" key={c}>
              <label htmlFor={`f${i}`}>{c}</label>
              <input
                id={`f${i}`}
                required
                autoFocus={i === 0}
                value={draft[i] ?? ""}
                onChange={(e) => setDraft((d) => d.map((v, k) => (k === i ? e.target.value : v)))}
              />
            </div>
          ))}
          <div className="form-actions">
            <button className="btn primary" type="submit">
              {editIdx >= 0 ? "Save changes" : `Add ${def.noun}`}
            </button>
            <button className="btn" type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              {def.cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={def.cols.length + 1} className="empty">
                  No records found.
                </td>
              </tr>
            )}
            {visible.map(({ r, i }) => (
              <tr key={i}>
                {r.map((v, ci) => (
                  <td key={ci} className={/#|code|SIM|plate/i.test(def.cols[ci]) ? "mono" : undefined}>
                    <Cell col={def.cols[ci]} value={v} />
                  </td>
                ))}
                <td className="act">
                  <button type="button" onClick={() => openEdit(i)}>Edit</button>
                  <button type="button" className="danger" onClick={() => remove(i)}>
                    {delIdx === i ? "Confirm delete" : "Delete"}
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
