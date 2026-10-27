import { vehicles } from "./data";

export interface PageDef {
  title: string;
  noun: string;
  cols: string[];
  rows: string[][];
}

export interface NavItem {
  href: string;
  label: string;
}
export interface NavEntry {
  label: string;
  href?: string;
  items?: NavItem[];
}

export const NAV: NavEntry[] = [
  { label: "Live tracking", href: "/" },
  {
    label: "Fleet",
    items: [
      { href: "/fleet/vehicles", label: "Vehicle info" },
      { href: "/fleet/devices", label: "Device info" },
      { href: "/fleet/sims", label: "Primary SIM numbers" },
      { href: "/fleet/drivers", label: "Drivers info" },
      { href: "/fleet/assets", label: "Assets group" },
    ],
  },
  {
    label: "Vehicle setup",
    items: [
      { href: "/setup/brands", label: "Brand" },
      { href: "/setup/brand-types", label: "Brand type" },
      { href: "/setup/colors", label: "Vehicle colors" },
    ],
  },
  {
    label: "Organization",
    items: [
      { href: "/organization/companies", label: "Companies" },
      { href: "/organization/customers", label: "Customers" },
    ],
  },
  {
    label: "Users",
    items: [
      { href: "/users", label: "Users" },
      { href: "/users/roles", label: "User roles" },
      { href: "/users/rights", label: "User rights" },
    ],
  },
  {
    label: "Locations",
    items: [
      { href: "/locations/countries", label: "Country" },
      { href: "/locations/states", label: "State" },
      { href: "/locations/cities", label: "City" },
    ],
  },
];

const typeOf: Record<string, string> = { Suzuki: "Ravi", Toyota: "Hilux", Honda: "CD 70" };
const sample = vehicles.slice(0, 9);
const NETWORKS = ["Jazz", "Zong", "Telenor", "Ufone"];

export const PAGE_DEFS: Record<string, PageDef> = {
  "fleet/vehicles": {
    title: "Vehicle info",
    noun: "vehicle",
    cols: ["Vehicle", "Plate / ID", "Brand", "Brand type", "Colour", "Asset group", "Device #"],
    rows: sample.map((v) => [v.name, v.plate, v.brand, typeOf[v.brand], v.color, v.group, v.device]),
  },
  "fleet/devices": {
    title: "Device info",
    noun: "device",
    cols: ["Device #", "Model", "Type", "SIM #", "Vehicle", "Status"],
    rows: sample.map((v, i) => [v.device, v.model, "GS", v.sim, v.name, i === 5 ? "Inactive" : "Active"]),
  },
  "fleet/sims": {
    title: "Primary SIM numbers",
    noun: "SIM",
    cols: ["SIM #", "Network", "Management #", "Device #", "Status"],
    rows: sample.map((v, i) => [v.sim, NETWORKS[i % 4], `92300963${3200 + i * 11}`, v.device, i === 5 ? "Inactive" : "Active"]),
  },
  "fleet/drivers": {
    title: "Drivers info",
    noun: "driver",
    cols: ["Name", "Phone", "License #", "Company", "Vehicle", "Status"],
    rows: sample.slice(0, 6).map((v, i) => [`${v.driver} Khan`, `0300 00000${10 + i}`, `LHR-${4100 + i * 7}`, "Sample Logistics", v.name, "Active"]),
  },
  "fleet/assets": {
    title: "Assets group",
    noun: "group",
    cols: ["Group", "Company", "Vehicles", "Status"],
    rows: [
      ["Lahore", "Sample Logistics", "6", "Active"],
      ["Rawalpindi", "Sample Logistics", "6", "Active"],
      ["Hyderabad", "Sample Logistics", "3", "Active"],
    ],
  },
  "setup/brands": {
    title: "Brand",
    noun: "brand",
    cols: ["Brand", "Country", "Status"],
    rows: [
      ["Suzuki", "Japan", "Active"],
      ["Toyota", "Japan", "Active"],
      ["Honda", "Japan", "Active"],
      ["Hino", "Japan", "Active"],
      ["Isuzu", "Japan", "Inactive"],
    ],
  },
  "setup/brand-types": {
    title: "Brand type",
    noun: "brand type",
    cols: ["Brand type", "Brand", "Vehicle class", "Status"],
    rows: [
      ["Ravi", "Suzuki", "Pickup", "Active"],
      ["Bolan", "Suzuki", "Van", "Active"],
      ["Hilux", "Toyota", "Pickup", "Active"],
      ["Corolla", "Toyota", "Car", "Active"],
      ["CD 70", "Honda", "Bike", "Active"],
    ],
  },
  "setup/colors": {
    title: "Vehicle colors",
    noun: "colour",
    cols: ["Colour", "Hex", "Status"],
    rows: [
      ["White", "#ffffff", "Active"],
      ["Silver", "#c0c4cc", "Active"],
      ["Blue", "#1d5fbf", "Active"],
      ["Black", "#111418", "Active"],
      ["Red", "#cc3b3b", "Active"],
    ],
  },
  "organization/companies": {
    title: "Companies",
    noun: "company",
    cols: ["Company", "City", "Contact person", "Phone", "Status"],
    rows: [
      ["Sample Logistics", "Lahore", "Ali Raza", "042 0000000", "Active"],
      ["Sample Transport", "Rawalpindi", "Usman Tariq", "051 0000000", "Active"],
      ["Sample Cargo", "Hyderabad", "Bilal Ahmed", "022 0000000", "Inactive"],
    ],
  },
  "organization/customers": {
    title: "Customers",
    noun: "customer",
    cols: ["Customer", "Company", "City", "Phone", "Status"],
    rows: [
      ["Customer A", "Sample Logistics", "Lahore", "0300 0000101", "Active"],
      ["Customer B", "Sample Logistics", "Karachi", "0300 0000102", "Active"],
      ["Customer C", "Sample Transport", "Rawalpindi", "0300 0000103", "Active"],
    ],
  },
  "users/users": {
    title: "Users",
    noun: "user",
    cols: ["Name", "Username", "Role", "Company", "Status"],
    rows: [
      ["Admin User", "admin", "Admin", "Sample Logistics", "Active"],
      ["Fleet Manager", "manager1", "Manager", "Sample Logistics", "Active"],
      ["Control Room 1", "operator1", "Operator", "Sample Transport", "Active"],
      ["Client View", "client1", "Viewer", "Sample Cargo", "Inactive"],
    ],
  },
  "users/roles": {
    title: "User roles",
    noun: "role",
    cols: ["Role", "Description", "Users", "Status"],
    rows: [
      ["Admin", "Full access to all pages", "1", "Active"],
      ["Manager", "Manage fleet data, no user deletion", "1", "Active"],
      ["Operator", "Live tracking and reports", "1", "Active"],
      ["Viewer", "Read only", "1", "Active"],
    ],
  },
  "users/rights": { title: "User rights", noun: "", cols: [], rows: [] },
  "locations/countries": {
    title: "Country",
    noun: "country",
    cols: ["Country", "Code", "Status"],
    rows: [
      ["Pakistan", "PK", "Active"],
      ["United Arab Emirates", "AE", "Active"],
      ["Saudi Arabia", "SA", "Inactive"],
    ],
  },
  "locations/states": {
    title: "State",
    noun: "state",
    cols: ["State / Province", "Country", "Status"],
    rows: [
      ["Punjab", "Pakistan", "Active"],
      ["Sindh", "Pakistan", "Active"],
      ["Khyber Pakhtunkhwa", "Pakistan", "Active"],
      ["Balochistan", "Pakistan", "Active"],
      ["Islamabad Capital Territory", "Pakistan", "Active"],
    ],
  },
  "locations/cities": {
    title: "City",
    noun: "city",
    cols: ["City", "State / Province", "Country", "Status"],
    rows: [
      ["Lahore", "Punjab", "Pakistan", "Active"],
      ["Rawalpindi", "Punjab", "Pakistan", "Active"],
      ["Bahawalpur", "Punjab", "Pakistan", "Active"],
      ["Karachi", "Sindh", "Pakistan", "Active"],
      ["Hyderabad", "Sindh", "Pakistan", "Active"],
    ],
  },
};

/** Pages that appear in the rights matrix (everything except the rights page itself). */
export const RIGHTS_MODULES: { href: string; label: string }[] = [
  { href: "/", label: "Live tracking" },
  ...NAV.flatMap((g) => g.items ?? []).filter((i) => i.href !== "/users/rights"),
];
