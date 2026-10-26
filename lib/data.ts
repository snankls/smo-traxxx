// Sample data. Replace with calls to the Laravel API (see README).

export type Status = "moving" | "idle" | "stopped" | "offline";

export interface Vehicle {
  id: number;
  name: string;
  group: string;
  plate: string;
  status: Status;
  lat: number;
  lng: number;
  speed: number;
  rpm: number;
  mileage: number;
  device: string;
  sim: string;
  model: string;
  color: string;
  year: number;
  brand: string;
  acc: string;
  received: string;
  gsm: number;
  gps: number;
  volt: string;
  fuel: number;
  driver: string;
}

export const STATUS_LABEL: Record<Status, string> = {
  moving: "Moving",
  idle: "ACC on, idle",
  stopped: "Stopped",
  offline: "Offline",
};

export const STATUS_COLOR: Record<Status, string> = {
  moving: "var(--moving)",
  idle: "var(--idle)",
  stopped: "var(--stopped)",
  offline: "var(--offline)",
};

const CITY: Record<string, [number, number]> = {
  Lahore: [31.5343, 74.2811],
  Rawalpindi: [33.5984, 73.0441],
  Hyderabad: [25.396, 68.3578],
};

const seed: [string, string, Status, number][] = [
  ["Lahore", "LHR-101 Truck 1", "moving", 46],
  ["Lahore", "LHR-102 Truck 2", "idle", 0],
  ["Lahore", "LHR-103 Truck 3", "moving", 38],
  ["Lahore", "LHR-104 Van 4", "stopped", 0],
  ["Lahore", "LHR-105 Van 5", "moving", 52],
  ["Lahore", "LHR-106 Pickup 6", "offline", 0],
  ["Rawalpindi", "RWP-201 Bike 1", "moving", 31],
  ["Rawalpindi", "RWP-202 Bike 2", "idle", 0],
  ["Rawalpindi", "RWP-203 Bike 3", "moving", 27],
  ["Rawalpindi", "RWP-204 Bike 4", "stopped", 0],
  ["Rawalpindi", "RWP-205 Bike 5", "offline", 0],
  ["Rawalpindi", "RWP-206 Bike 6", "moving", 44],
  ["Hyderabad", "HYD-301 Truck 1", "idle", 0],
  ["Hyderabad", "HYD-302 Truck 2", "moving", 41],
  ["Hyderabad", "HYD-303 Truck 3", "stopped", 0],
];

const COLORS = ["White", "Silver", "Blue", "Black"];
const BRANDS = ["Suzuki", "Toyota", "Honda"];
const DRIVERS = ["Imran", "Waqas", "Sajid", "Kamran", "Adeel"];
const pad = (n: number) => String(n).padStart(2, "0");

export const vehicles: Vehicle[] = seed.map(([group, name, status, speed], i) => {
  const [lat, lng] = CITY[group];
  return {
    id: i,
    name,
    group,
    plate: `${group.slice(0, 1)}M-${i + 1}`,
    status,
    speed,
    rpm: speed ? 900 + speed * 20 : 0,
    lat: lat + (((i * 37) % 11) - 5) * 0.006,
    lng: lng + (((i * 53) % 13) - 6) * 0.006,
    mileage: 9000 + i * 4870.3,
    device: String(356495049228000 + i * 37),
    sim: `92345080${2900 + i * 13}`,
    model: "G6S",
    color: COLORS[i % 4],
    year: 2016 + (i % 6),
    brand: BRANDS[i % 3],
    acc: status === "offline" ? "ACC off" : "ACC on",
    received: `13:${pad(58 - (i % 7))}:${pad(10 + ((i * 3) % 50))}`,
    gsm: 5 + (i % 5),
    gps: 3 + (i % 8),
    volt: (12.1 + (i % 9) * 0.1).toFixed(2),
    fuel: 30 + ((i * 7) % 60),
    driver: DRIVERS[i % 5],
  };
});

export const coordText = (v: Vehicle) => `${v.lat.toFixed(6)}, ${v.lng.toFixed(6)}`;
