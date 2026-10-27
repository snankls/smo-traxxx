"use client";

// Vehicle: list, search, add, edit and delete on this one page.
// The form has the vehicle details on top and three tabs below: Installation, SMS settings, Contact details.
// Table: Sr # and checkbox columns, sorting on every column, show/hide columns, bulk delete.
// Everything in this file belongs to this page only. Data is kept in memory (no API).

import { CSSProperties, FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type Vehicle = {
  assetType: string; regNo: string; engineNo: string; chassisNo: string;
  brand: string; brandType: string; version: string; model: string; colour: string; transmission: string; engineType: string;
  customer: string; group: string; dob: string; motherName: string; tPin: string; ePin: string;
};
type Install = {
  installType: string; deviceId: string; unitSim: string; managementNo: string;
  installBy: string; installDate: string; result: string; remarks: string; accessories: string;
};
type Sms = {
  startDate: string; endDate: string; fromTime: string; toTime: string; days: string[]; numbers: string[];
  intervalUnit: string; intervalValue: string; channel: string; network: string; remotePole: boolean;
};
type Contact = { id: number; priority: string; name: string; relation: string; cell1: string; cell2: string; phone1: string; phone2: string };
type Form = { vehicle: Vehicle; install: Install; sms: Sms; contacts: Contact[] };
type Row = Form & { id: number };
type Item = { r: Row; sr: number }; // sr = fixed serial number of the row (its position in the full list)
type Tab = "install" | "sms" | "contacts";

// Options of the select lists.
const assetTypes = ["Car", "Bike", "Truck", "Bus", "Van"];
const brandTypes: Record<string, string[]> = {
  Toyota: ["Corolla", "Yaris", "Hilux", "Fortuner"],
  Honda: ["Civic", "City", "BR-V"],
  Suzuki: ["Alto", "Cultus", "Swift", "Bolan"],
  Hyundai: ["Elantra", "Tucson"],
  KIA: ["Picanto", "Sportage"],
};
const brands = Object.keys(brandTypes);
const versions = ["Standard", "XLI", "GLI", "VXI", "Altis"];
const colours = ["White", "Black", "Silver", "Grey", "Red", "Blue"];
const transmissions = ["Auto", "Manual"];
const engineTypes = ["EFI", "Carburetor", "Diesel", "Hybrid", "Electric"];
const customers = ["Servo Motor Oil", "Delta Builder", "Test Customer"];
const groups = ["Assets", "Test Bench", "Head Office", "Servo Hub Multan", "Servo Hub Bannu", "Delta Builder"];
const installTypes = ["None", "New installation", "Re-installation", "Replacement"];
const relations = ["Self", "Father", "Mother", "Spouse", "Brother", "Driver", "Other"];
const intervalUnits = ["Hours", "Minutes"];
const channels = ["SMS", "GPRS"];
const smsNetworks = ["Any", "Jazz", "Telenor", "Ufone", "Zong"];
const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isoToday() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// a fresh form; SMS duration starts today and runs for one year, all days allowed
function blankForm(today: string): Form {
  let end = "";
  if (today) {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() + 1);
    end = d.toISOString().slice(0, 10);
  }
  return {
    vehicle: {
      assetType: "Car", regNo: "", engineNo: "", chassisNo: "",
      brand: "", brandType: "", version: "", model: "", colour: "", transmission: "", engineType: "",
      customer: "", group: "", dob: "", motherName: "", tPin: "", ePin: "",
    },
    install: { installType: "None", deviceId: "", unitSim: "", managementNo: "", installBy: "", installDate: today, result: "", remarks: "", accessories: "" },
    sms: {
      startDate: today, endDate: end, fromTime: "00:00", toTime: "23:59", days: [...weekDays], numbers: ["", "", "", ""],
      intervalUnit: "Hours", intervalValue: "0", channel: "SMS", network: "Any", remotePole: false,
    },
    contacts: [],
  };
}

function sample(id: number, v: Partial<Vehicle>, i: Partial<Install>, contacts: Contact[] = []): Row {
  const b = blankForm("2026-10-22");
  return { id, vehicle: { ...b.vehicle, ...v }, install: { ...b.install, ...i }, sms: b.sms, contacts };
}

const initialRows: Row[] = [
  sample(
    1,
    { regNo: "MND-15-756", brand: "Toyota", brandType: "Corolla", version: "VXI", model: "2015", colour: "White", transmission: "Auto", engineType: "EFI", customer: "Servo Motor Oil", group: "Test Bench", dob: "1999-01-01" },
    { installType: "New installation", deviceId: "351535054751789", unitSim: "923483561724", installBy: "Ali Raza", installDate: "2026-10-20", result: "Working" },
    [{ id: 1, priority: "1", name: "Imran Khan", relation: "Driver", cell1: "923001234567", cell2: "", phone1: "", phone2: "" }],
  ),
  sample(
    2,
    { regNo: "CAS-8682", brand: "Honda", brandType: "Civic", version: "VXI", model: "2018", colour: "Black", transmission: "Manual", engineType: "EFI", customer: "Servo Motor Oil", group: "Servo Hub Multan" },
    { installType: "New installation", deviceId: "356496047454905", unitSim: "923450802955", installBy: "Usman Ali", installDate: "2026-09-12", result: "Working" },
  ),
  sample(3, { regNo: "LES-16-5428", brand: "Suzuki", brandType: "Cultus", model: "2016", colour: "Silver", customer: "Delta Builder", group: "Delta Builder" }, {}),
];

const statusOf = (r: Row) => (r.install.installType === "None" ? "Not installed" : "Installed");

// Data columns. The checkbox and Actions columns are always shown.
const columns: { key: string; label: string; get: (i: Item) => string | number; mono?: boolean }[] = [
  { key: "sr", label: "Sr #", get: (i) => i.sr, mono: true },
  { key: "regNo", label: "Registration #", get: (i) => i.r.vehicle.regNo, mono: true },
  { key: "assetType", label: "Asset type", get: (i) => i.r.vehicle.assetType },
  { key: "brand", label: "Brand", get: (i) => i.r.vehicle.brand },
  { key: "brandType", label: "Brand type", get: (i) => i.r.vehicle.brandType },
  { key: "customer", label: "Customer", get: (i) => i.r.vehicle.customer },
  { key: "group", label: "Group", get: (i) => i.r.vehicle.group },
  { key: "deviceId", label: "Device ID", get: (i) => i.r.install.deviceId, mono: true },
  { key: "status", label: "Status", get: (i) => statusOf(i.r) },
];

function haystack(r: Row) {
  const v = r.vehicle;
  return [v.regNo, v.engineNo, v.chassisNo, v.assetType, v.brand, v.brandType, v.model, v.customer, v.group, r.install.deviceId, r.install.unitSim, statusOf(r), ...r.contacts.map((c) => c.name)]
    .join(" ")
    .toLowerCase();
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

/* ---------- small form pieces ---------- */

function Field({ id, label, wide, children }: { id: string; label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className="field" style={wide ? { gridColumn: "1 / -1" } : undefined}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function TextField(p: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; disabled?: boolean; placeholder?: string; wide?: boolean;
  min?: number; max?: number; inputMode?: "text" | "numeric" | "tel"; autoFocus?: boolean;
}) {
  return (
    <Field id={p.id} label={p.label} wide={p.wide}>
      <input
        id={p.id} type={p.type ?? "text"} value={p.value} required={p.required} disabled={p.disabled} placeholder={p.placeholder}
        min={p.min} max={p.max} inputMode={p.inputMode} autoFocus={p.autoFocus} onChange={(e) => p.onChange(e.target.value)}
      />
    </Field>
  );
}

function SelectField(p: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: string[];
  placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  // a value already saved on a row stays selectable even if it is not in the list
  const list = p.value && !p.options.includes(p.value) ? [...p.options, p.value] : p.options;
  return (
    <Field id={p.id} label={p.label}>
      <select id={p.id} value={p.value} required={p.required} disabled={p.disabled} onChange={(e) => p.onChange(e.target.value)}>
        <option value="">{p.placeholder ?? "Select"}</option>
        {list.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

/* ---------- styles ---------- */

const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "14px 16px", alignItems: "start" };
const pad: CSSProperties = { padding: 16 };
const sectionTitle: CSSProperties = { margin: "0 0 12px", fontSize: 14, fontWeight: 600 };
const subTitle: CSSProperties = { margin: "18px 0 10px", fontSize: 13, fontWeight: 600, opacity: 0.8 };
const hint: CSSProperties = { margin: "10px 0 0", fontSize: 12, opacity: 0.65 };
const tabBar: CSSProperties = { display: "flex", gap: 4, padding: "0 12px", borderBottom: "1px solid var(--line)", overflowX: "auto" };
const tabButton = (on: boolean): CSSProperties => ({
  border: 0, background: "none", font: "inherit", color: "inherit", padding: "11px 14px", cursor: "pointer", whiteSpace: "nowrap",
  opacity: on ? 1 : 0.6, fontWeight: on ? 600 : 400, borderBottom: on ? "2px solid currentColor" : "2px solid transparent", marginBottom: -1,
});
const chip: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", border: "1px solid var(--line)", borderRadius: 999, cursor: "pointer" };
const actionBar: CSSProperties = {
  position: "sticky", bottom: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
  background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 6,
};
const cellInput: CSSProperties = { width: "100%", minWidth: 110 };

const sortButton: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, border: 0, background: "none", padding: 0,
  font: "inherit", color: "inherit", textTransform: "inherit", letterSpacing: "inherit", cursor: "pointer",
};
const menuBox: CSSProperties = {
  position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 30, minWidth: 190, padding: 6,
  background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,.2)",
};
const menuRow: CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer" };

export default function VehiclesPage() {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(() => blankForm(""));
  const [tab, setTab] = useState<Tab>("install");
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const [sortKey, setSortKey] = useState("sr");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hidden, setHidden] = useState<string[]>([]);
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
  const sortCol = columns.find((c) => c.key === sortKey) ?? columns[0];

  const visible: Item[] = rows
    .map((r, i) => ({ r, sr: i + 1 }))
    .filter(({ r }) => !needle || haystack(r).includes(needle))
    .sort((a, b) => {
      const x = sortCol.get(a);
      const y = sortCol.get(b);
      const c =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? c : -c;
    });

  const allChecked = visible.length > 0 && visible.every(({ r }) => selected.includes(r.id));
  const someChecked = visible.some(({ r }) => selected.includes(r.id));

  function sortBy(key: string) {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleColumn(key: string) {
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

  /* ---------- form updates ---------- */

  const setV = (p: Partial<Vehicle>) => setForm((f) => ({ ...f, vehicle: { ...f.vehicle, ...p } }));
  const setI = (p: Partial<Install>) => setForm((f) => ({ ...f, install: { ...f.install, ...p } }));
  const setS = (p: Partial<Sms>) => setForm((f) => ({ ...f, sms: { ...f.sms, ...p } }));

  function addContact() {
    setForm((f) => ({
      ...f,
      contacts: [
        ...f.contacts,
        { id: f.contacts.reduce((m, c) => Math.max(m, c.id), 0) + 1, priority: String(f.contacts.length + 1), name: "", relation: "", cell1: "", cell2: "", phone1: "", phone2: "" },
      ],
    }));
  }

  function setContact(id: number, p: Partial<Contact>) {
    setForm((f) => ({ ...f, contacts: f.contacts.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  }

  function removeContact(id: number) {
    setForm((f) => ({ ...f, contacts: f.contacts.filter((c) => c.id !== id) }));
  }

  function openAdd() {
    setEditId(null);
    setForm(blankForm(isoToday()));
    setTab("install");
    setError("");
    setConfirmId(null);
    setShowForm(true);
  }

  function openEdit(r: Row) {
    const { id, ...rest } = r;
    setEditId(id);
    setForm(rest);
    setTab("install");
    setError("");
    setConfirmId(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setError("");
  }

  function fail(message: string, onTab?: Tab) {
    setError(message);
    if (onTab) setTab(onTab);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    const reg = form.vehicle.regNo.trim();
    if (!reg) return fail("Registration # is required.");
    if (rows.some((r) => r.id !== editId && r.vehicle.regNo.trim().toLowerCase() === reg.toLowerCase())) {
      return fail(`Registration # ${reg} already exists.`);
    }
    const s = form.sms;
    if (s.startDate && s.endDate && s.endDate < s.startDate) return fail("SMS end date must be on or after the start date.", "sms");
    const interval = Number(s.intervalValue);
    if (!Number.isInteger(interval) || interval < 0 || interval > 99) return fail("Time interval must be a whole number from 0 to 99.", "sms");

    // drop empty contact rows, every other row needs a name, and keep them in priority order
    const filled = form.contacts.filter((c) => [c.name, c.cell1, c.cell2, c.phone1, c.phone2].some((x) => x.trim()));
    if (filled.some((c) => !c.name.trim())) return fail("Every contact needs a name.", "contacts");
    const contacts = [...filled].sort((a, b) => Number(a.priority) - Number(b.priority));

    const data: Form = { ...form, vehicle: { ...form.vehicle, regNo: reg }, contacts };
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

  function renderCell(item: Item, c: (typeof columns)[number]) {
    const value = c.get(item);
    if (c.key === "status") {
      return (
        <td key={c.key}>
          <span className="pill" style={{ ["--c" as string]: item.r.install.installType === "None" ? "var(--offline)" : "var(--moving)" } as CSSProperties}>
            <i />
            {value}
          </span>
        </td>
      );
    }
    return (
      <td key={c.key} className={c.mono ? "mono" : undefined}>
        {value === "" ? "—" : value}
      </td>
    );
  }

  /* ---------- form view (replaces the list while adding / editing) ---------- */

  if (showForm) {
    const v = form.vehicle;
    const ins = form.install;
    const s = form.sms;
    const noDevice = ins.installType === "None";
    const tabs: { key: Tab; label: string }[] = [
      { key: "install", label: "Installation" },
      { key: "sms", label: "SMS settings" },
      { key: "contacts", label: `Contact details${form.contacts.length ? ` (${form.contacts.length})` : ""}` },
    ];

    return (
      <section className="page">
        <div className="page-head">
          <h1>{editId === null ? "Add vehicle" : "Edit vehicle"}</h1>
          <span className="sub">{editId === null ? "Fill in the vehicle details, then the tabs below." : v.regNo}</span>
        </div>

        <form onSubmit={save} autoComplete="off" style={{ display: "grid", gap: 16 }}>
          <div className="card" style={pad}>
            <h2 style={sectionTitle}>Vehicle</h2>
            <div style={grid}>
              <SelectField id="assetType" label="Asset type" required value={v.assetType} options={assetTypes} onChange={(x) => setV({ assetType: x })} />
              <TextField id="regNo" label="Registration #" required autoFocus value={v.regNo} onChange={(x) => setV({ regNo: x })} />
              <TextField id="engineNo" label="Engine #" value={v.engineNo} onChange={(x) => setV({ engineNo: x })} />
              <TextField id="chassisNo" label="Chassis #" value={v.chassisNo} onChange={(x) => setV({ chassisNo: x })} />
            </div>

            <h2 style={subTitle}>Specification</h2>
            <div style={grid}>
              <SelectField id="brand" label="Brand" value={v.brand} options={brands} onChange={(x) => setV({ brand: x, brandType: "" })} />
              <SelectField
                id="brandType" label="Brand type" value={v.brandType} options={brandTypes[v.brand] ?? []} disabled={!v.brand}
                placeholder={v.brand ? "Select" : "Select brand first"} onChange={(x) => setV({ brandType: x })}
              />
              <SelectField id="version" label="Version" value={v.version} options={versions} onChange={(x) => setV({ version: x })} />
              <TextField id="model" label="Model" value={v.model} onChange={(x) => setV({ model: x })} />
              <SelectField id="colour" label="Colour" value={v.colour} options={colours} onChange={(x) => setV({ colour: x })} />
              <SelectField id="transmission" label="Transmission" value={v.transmission} options={transmissions} onChange={(x) => setV({ transmission: x })} />
              <SelectField id="engineType" label="Engine type" value={v.engineType} options={engineTypes} onChange={(x) => setV({ engineType: x })} />
            </div>

            <h2 style={subTitle}>Owner and verification</h2>
            <div style={grid}>
              <SelectField id="customer" label="Customer" value={v.customer} options={customers} onChange={(x) => setV({ customer: x })} />
              <SelectField id="group" label="Group" value={v.group} options={groups} onChange={(x) => setV({ group: x })} />
              <TextField id="dob" label="DOB" type="date" value={v.dob} onChange={(x) => setV({ dob: x })} />
              <TextField id="motherName" label="Mother name" value={v.motherName} onChange={(x) => setV({ motherName: x })} />
              <TextField id="tPin" label="T-Pin" inputMode="numeric" value={v.tPin} onChange={(x) => setV({ tPin: x })} />
              <TextField id="ePin" label="E-Pin" inputMode="numeric" value={v.ePin} onChange={(x) => setV({ ePin: x })} />
            </div>
          </div>

          <div className="card">
            <div style={tabBar} role="tablist">
              {tabs.map((t) => (
                <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} style={tabButton(tab === t.key)} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={pad} role="tabpanel">
              {tab === "install" && (
                <>
                  <div style={grid}>
                    <SelectField
                      id="installType" label="Install type" value={ins.installType} options={installTypes}
                      onChange={(x) => setI({ installType: x, ...(x === "None" ? { deviceId: "", unitSim: "", managementNo: "" } : {}) })}
                    />
                    <Field id="installStatus" label="Status">
                      <div id="installStatus">
                        <span className="pill" style={{ ["--c" as string]: noDevice ? "var(--offline)" : "var(--moving)" } as CSSProperties}>
                          <i />
                          {noDevice ? "Not installed" : "Installed"}
                        </span>
                      </div>
                    </Field>
                    <TextField id="installDate" label="Install date" type="date" value={ins.installDate} onChange={(x) => setI({ installDate: x })} />
                    <TextField id="installBy" label="Install by" value={ins.installBy} onChange={(x) => setI({ installBy: x })} />
                    <TextField id="deviceId" label="Device ID" disabled={noDevice} inputMode="numeric" value={ins.deviceId} onChange={(x) => setI({ deviceId: x })} />
                    <TextField id="unitSim" label="Unit SIM #" disabled={noDevice} inputMode="tel" value={ins.unitSim} onChange={(x) => setI({ unitSim: x })} />
                    <TextField id="managementNo" label="Management #" disabled={noDevice} value={ins.managementNo} onChange={(x) => setI({ managementNo: x })} />
                    <TextField id="result" label="Result" value={ins.result} onChange={(x) => setI({ result: x })} />
                    <TextField id="remarks" label="Remarks" wide value={ins.remarks} onChange={(x) => setI({ remarks: x })} />
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label htmlFor="accessories">Accessories</label>
                      <textarea id="accessories" required style={textareaStyle} value={ins.accessories} onChange={(e) => setI({ accessories: e.target.value })} />
                    </div>
                  </div>
                  {noDevice && <p style={hint}>Choose an install type to enter the device ID, unit SIM and management #.</p>}
                </>
              )}

              {tab === "sms" && (
                <>
                  <h2 style={{ ...sectionTitle, fontSize: 13 }}>Duration</h2>
                  <div style={grid}>
                    <TextField id="smsStart" label="Start date" type="date" value={s.startDate} onChange={(x) => setS({ startDate: x })} />
                    <TextField id="smsEnd" label="End date" type="date" value={s.endDate} onChange={(x) => setS({ endDate: x })} />
                    <TextField id="fromTime" label="From time" type="time" value={s.fromTime} onChange={(x) => setS({ fromTime: x })} />
                    <TextField id="toTime" label="To time" type="time" value={s.toTime} onChange={(x) => setS({ toTime: x })} />
                  </div>

                  <h2 style={subTitle}>Allow in days</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    {weekDays.map((d) => (
                      <label key={d} style={chip}>
                        <input
                          type="checkbox"
                          checked={s.days.includes(d)}
                          onChange={(e) => setS({ days: e.target.checked ? weekDays.filter((x) => x === d || s.days.includes(x)) : s.days.filter((x) => x !== d) })}
                        />
                        {d}
                      </label>
                    ))}
                    <button className="btn" type="button" onClick={() => setS({ days: s.days.length === 7 ? [] : [...weekDays] })}>
                      {s.days.length === 7 ? "Clear all" : "Select all"}
                    </button>
                  </div>

                  <h2 style={subTitle}>At numbers</h2>
                  <div style={grid}>
                    {s.numbers.map((n, i) => (
                      <TextField
                        key={i} id={`smsNumber${i + 1}`} label={`SIM # ${i + 1}`} type="tel" inputMode="tel" value={n}
                        onChange={(x) => setS({ numbers: s.numbers.map((y, j) => (j === i ? x : y)) })}
                      />
                    ))}
                  </div>

                  <h2 style={subTitle}>Time interval based SMS</h2>
                  <div style={grid}>
                    <SelectField id="intervalUnit" label="Unit" value={s.intervalUnit} options={intervalUnits} placeholder="Select" onChange={(x) => setS({ intervalUnit: x })} />
                    <TextField id="intervalValue" label="Every" type="number" min={0} max={99} value={s.intervalValue} onChange={(x) => setS({ intervalValue: x })} />
                  </div>
                  <p style={hint}>1 to 99. Enter 0 to remove the time based SMS.</p>

                  <h2 style={subTitle}>Channel</h2>
                  <div style={grid}>
                    <SelectField id="channel" label="Channel type" value={s.channel} options={channels} onChange={(x) => setS({ channel: x })} />
                    <SelectField id="smsNetwork" label="Network" value={s.network} options={smsNetworks} onChange={(x) => setS({ network: x })} />
                  </div>
                  <label style={{ ...menuRow, padding: "12px 0 0" }}>
                    <input type="checkbox" checked={s.remotePole} onChange={(e) => setS({ remotePole: e.target.checked })} />
                    Allow remote pole location
                  </label>
                </>
              )}

              {tab === "contacts" && (
                <>
                  {form.contacts.length === 0 ? (
                    <p style={{ margin: "0 0 12px", opacity: 0.7 }}>No contacts yet. Add the people to call about this vehicle.</p>
                  ) : (
                    <div style={{ overflowX: "auto", marginBottom: 12 }}>
                      <table style={{ minWidth: 820 }}>
                        <thead>
                          <tr>
                            <th style={{ width: 80 }}>Priority</th>
                            <th>Name</th>
                            <th>Relation</th>
                            <th>Cell #1</th>
                            <th>Cell #2</th>
                            <th>Phone #1</th>
                            <th>Phone #2</th>
                            <th style={{ width: 80 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.contacts.map((c, i) => (
                            <tr key={c.id}>
                              <td>
                                <input aria-label={`Priority of contact ${i + 1}`} type="number" min={1} style={cellInput} value={c.priority} onChange={(e) => setContact(c.id, { priority: e.target.value })} />
                              </td>
                              <td>
                                <input aria-label={`Name of contact ${i + 1}`} style={cellInput} value={c.name} onChange={(e) => setContact(c.id, { name: e.target.value })} />
                              </td>
                              <td>
                                <select aria-label={`Relation of contact ${i + 1}`} style={cellInput} value={c.relation} onChange={(e) => setContact(c.id, { relation: e.target.value })}>
                                  <option value="">Select</option>
                                  {(c.relation && !relations.includes(c.relation) ? [...relations, c.relation] : relations).map((o) => (
                                    <option key={o}>{o}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input aria-label={`Cell 1 of contact ${i + 1}`} type="tel" style={cellInput} value={c.cell1} onChange={(e) => setContact(c.id, { cell1: e.target.value })} />
                              </td>
                              <td>
                                <input aria-label={`Cell 2 of contact ${i + 1}`} type="tel" style={cellInput} value={c.cell2} onChange={(e) => setContact(c.id, { cell2: e.target.value })} />
                              </td>
                              <td>
                                <input aria-label={`Phone 1 of contact ${i + 1}`} type="tel" style={cellInput} value={c.phone1} onChange={(e) => setContact(c.id, { phone1: e.target.value })} />
                              </td>
                              <td>
                                <input aria-label={`Phone 2 of contact ${i + 1}`} type="tel" style={cellInput} value={c.phone2} onChange={(e) => setContact(c.id, { phone2: e.target.value })} />
                              </td>
                              <td className="act">
                                <button type="button" className="danger" onClick={() => removeContact(c.id)}>
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button className="btn" type="button" onClick={addContact}>
                    Add contact
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={actionBar}>
            {error && (
              <span role="alert" style={{ color: "var(--stopped)" }}>
                {error}
              </span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <button className="btn" type="button" onClick={closeForm}>
                Cancel
              </button>
              <button className="btn primary" type="submit">
                {editId === null ? "Add vehicle" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </section>
    );
  }

  /* ---------- list view ---------- */

  return (
    <section className="page">
      <div className="page-head">
        <h1>Vehicle</h1>
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
            Add vehicle
          </button>
        </div>
      </div>

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
                    aria-label={`Select ${item.r.vehicle.regNo}`}
                    checked={selected.includes(item.r.id)}
                    onChange={(e) => toggleRow(item.r.id, e.target.checked)}
                  />
                </td>
                {shown.map((c) => renderCell(item, c))}
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